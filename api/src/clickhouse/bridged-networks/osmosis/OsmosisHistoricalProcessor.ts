import { InjectQueue, Processor, WorkerHost } from "@nestjs/bullmq";
import { Job, Queue } from "bullmq";
import axios from "axios";
import { ClickhouseService } from '../../clickhouse.service.js';
import { BigQuery } from '@google-cloud/bigquery';

interface MintBurnEvent {
  timestamp: number;
  type: string;
  amount: string;
  address: string;
}

interface TransferEvent {
  timestamp: number;
  from: string;
  to: string;
  amount: string;
}

interface PoolSwapEvent {
  timestamp: number;
  sender: string;
  side: string;
  amount: string;
}

@Processor("osmosis-historical")
export class OsmosisHistoricalProcessor extends WorkerHost {
  private readonly endpoint = 'https://osmosis.numia.xyz/v2/txs';
  private readonly pageSize = 100;
  private readonly bigQueryClient: BigQuery;

  constructor(
    private readonly clickhouseService: ClickhouseService,

    @InjectQueue("osmosis-historical")
    private readonly osmosisQueue: Queue,
  ) {
    super();
    // Path to service account key file
    const keyFile = './bigquery_service_account.json';

    // Create a BigQuery client
    this.bigQueryClient = new BigQuery({
      keyFilename: keyFile,
    });
  }

  public async process(job: Job<any, any, string>): Promise<any> {
    switch (job.name) {
      case "fetchHistoricalData":
        try {
          await this.fetchHistoricalData();
        } catch (error) {
          // fail silently to avoid accumulating failed repeating jobs
        }
        break;

      default:
        throw new Error(`invalid job name ${job.name}`);
    }
  }

  public async triggerFetchHistoricalData() {
    await this.osmosisQueue.add("fetchHistoricalData", undefined);
    // await this.fetchMintBurnEvents();
    // await this.fetchPoolSwapEvents();
  }

  private async fetchHistoricalData() {
    await this.fetchMintBurnEvents(); // And internally, one hop transfers of wLIBRA
    await this.fetchPoolSwapEvents();
  }

  private async fetchMintBurnEvents() {
    let page = 1;
    let hasMore = true;

    while (hasMore) {
      const url = `${this.endpoint}/osmo19hdqma2mj0vnmgcxag6ytswjnr8a3y07q7e70p?pageSize=${this.pageSize}&page=${page}`;
      console.log(url)
      const response = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${process.env.NUMIA_API_KEY}`,
        },
      });
      const events = response.data;

      if (events.length === 0) {
        hasMore = false;
        continue;
      }

      for (const event of events) {
        const timestamp = new Date(event.blockTimestamp).getTime();
        const type = event.messageTypes[0] === '/osmosis.tokenfactory.v1beta1.MsgMint' ? 'mint' : 'burn';
        const amount = event.messages[0].amount.amount;
        const address = type === 'mint' ? event.messages[0].mint_to_address : event.messages[0].burn_from_address;

        await this.insertMintBurnEvent({ timestamp, type, amount, address });

        if (type === 'mint') {
          // Not a proper DFS, just one hop away from minter
          await this.fetchTransfersForAddress(event.messages[0].mint_to_address);
        }
      }

      page++;
    }
  }

  private async fetchTransfersForAddress(address: string) {
    let page = 1;
    let hasMore = true;

    while (hasMore) {
      const url = `${this.endpoint}/${address}?pageSize=${this.pageSize}&page=${page}`;
      const response = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${process.env.NUMIA_API_KEY}`,
        },
      });
      const events = response.data;

      if (events.length === 0) {
        hasMore = false;
        continue;
      }

      for (const event of events) {
        if (event.messageTypes.includes('/cosmos.bank.v1beta1.MsgSend')) {
          for (const message of event.messages) {
            if (message.amount[0].denom === 'factory/osmo19hdqma2mj0vnmgcxag6ytswjnr8a3y07q7e70p/wLIBRA') {
              const transferEvent = {
                timestamp: new Date(event.blockTimestamp).getTime(),
                from: message.from_address,
                to: message.to_address,
                amount: message.amount.amount,
              };
              await this.insertTransferEvent(transferEvent);
            }
          }
        }
      }

      page++;
    }
  }

  private async fetchPoolSwapEvents() {
    const query = `
      SELECT
        tx_id,
        sender,
        denom_in,
        parsed_amount_in,
        denom_out,
        parsed_amount_out,
        ingestion_timestamp
      FROM \`numia-data.osmosis.osmosis_swaps\`
      WHERE pool_id = '1721'
      ORDER BY ingestion_timestamp ASC
    `;

    const [rows] = await this.bigQueryClient.query(query);

    for (const row of rows) {
      const side = row.denom_in === 'factory/osmo19hdqma2mj0vnmgcxag6ytswjnr8a3y07q7e70p/wLIBRA' ? 'buy' : 'sell';
      const swapEvent = {
        timestamp: new Date(row.ingestion_timestamp.value).getTime(),
        sender: row.sender,
        side,
        amount: side === 'buy' ? row.parsed_amount_in : row.parsed_amount_out,
      };
      await this.insertSwapEvent(swapEvent);
    }
  }

  private async insertMintBurnEvent(event: MintBurnEvent) {
    // console.log('Mint/Burn Event:', event);
    await this.clickhouseService.client.insert({
      table: 'mint_burn_events',
      values: {
        timestamp: event.timestamp,
        type: event.type,
        amount: event.amount,
        address: event.address,
      }
    });
  }

  private async insertTransferEvent(event: TransferEvent) {
    // console.log('Transfer Event:', event);
    await this.clickhouseService.client.insert({
      table: 'transfer_events',
      values: {
        timestamp: event.timestamp,
        from: event.from,
        to: event.to,
        amount: event.amount,
      }
    });
  }

  private async insertSwapEvent(event: PoolSwapEvent) {
    // console.log('Pool Swap Event:', event);
    await this.clickhouseService.client.insert({
      table: 'pool_swap_events',
      values: {
        timestamp: event.timestamp,
        sender: event.sender,
        side: event.side,
        amount: event.amount,
      }
    });
  }
}
