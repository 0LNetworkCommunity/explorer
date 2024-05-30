import { Job, Queue } from "bullmq";
import { BigQuery } from "@google-cloud/bigquery";
import axios from "axios";
import { InjectQueue, Processor, WorkerHost } from "@nestjs/bullmq";
import { ConfigService } from "@nestjs/config";

import { ClickhouseService } from "../clickhouse/clickhouse.service.js";
import { NumiaConfig } from "../config/config.interface.js";

interface PoolSwapEvent {
  timestamp: number;
  sender: string;
  side: string;
  amount: string;
  txhash: string;
}

interface MintEvent {
  timestamp: number;
  amount: string;
  mint_to_address: string;
  txhash: string;
}

interface BurnEvent {
  timestamp: number;
  amount: string;
  burn_from_address: string;
  txhash: string;
}

interface TransferEvent {
  timestamp: number;
  from_address: string;
  to_address: string;
  amount: string;
  txhash: string;
}

@Processor("osmosis-historical")
export class OsmosisHistoricalProcessor extends WorkerHost {
  private readonly endpoint = "https://osmosis.numia.xyz/v2/txs";

  private readonly pageSize = 100;

  private readonly numiaApiKey?: string;

  private readonly bigQueryClient: BigQuery;

  private readonly TOKEN_DENOM = 'factory/osmo19hdqma2mj0vnmgcxag6ytswjnr8a3y07q7e70p/wLIBRA';

  constructor(
    config: ConfigService,

    private readonly clickhouseService: ClickhouseService,

    @InjectQueue("osmosis-historical")
    private readonly osmosisQueue: Queue,
  ) {
    super();

    this.numiaApiKey = config.get<NumiaConfig>("numia")?.apiKey;

    // Path to service account key file
    const keyFile = "./bigquery_service_account.json";

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
  }

  private async fetchHistoricalData() {
    await this.fetchMintBurnEvents(); // And internally, one hop transfers of wLIBRA
    await this.fetchPoolSwapEvents();
  }

  private async fetchMintBurnEvents() {
    for (let page = 1; ; ++page) {
      const url = `${this.endpoint}/osmo19hdqma2mj0vnmgcxag6ytswjnr8a3y07q7e70p?pageSize=${this.pageSize}&page=${page}`;
      const response = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${this.numiaApiKey}`,
        },
      });
      const events = response.data;

      if (events.length === 0) {
        break;
      }

      for (const event of events) {
        const timestamp = new Date(event.blockTimestamp).getTime();
        const type =
          event.messageTypes[0] === "/osmosis.tokenfactory.v1beta1.MsgMint"
            ? "mint"
            : "burn";
        const amount = event.messages[0].amount.amount;
        const address =
          type === "mint"
            ? event.messages[0].mint_to_address
            : event.messages[0].burn_from_address;
        const txhash = event.hash;

        if (type === "mint") {
          const mintEvent: MintEvent = {
            timestamp,
            amount,
            mint_to_address: address,
            txhash
          };
          await this.insertMintEvent(mintEvent);
          // Not a proper DFS, just one hop away from minter
          await this.fetchTransfersForAddress(event.messages[0].mint_to_address);
        } else {
          const burnEvent: BurnEvent = {
            timestamp,
            amount,
            burn_from_address: address,
            txhash
          };
          await this.insertBurnEvent(burnEvent);
        }
      }
    }
  }

  private async fetchTransfersForAddress(address: string) {
    for (let page = 1; ; ++page) {
      const url = `${this.endpoint}/${address}?pageSize=${this.pageSize}&page=${page}`;
      const response = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${this.numiaApiKey}`,
        },
      });
      const events = response.data;

      if (events.length === 0) {
        break;
      }

      for (const event of events) {
        if (event.messageTypes.includes("/cosmos.bank.v1beta1.MsgSend")) {
          for (const message of event.messages) {
            if (
              message.amount[0].denom === this.TOKEN_DENOM
            ) {
              const transferEvent: TransferEvent = {
                timestamp: new Date(event.blockTimestamp).getTime(),
                from_address: message.from_address,
                to_address: message.to_address,
                amount: message.amount.amount,
                txhash: event.hash,
              };
              await this.insertTransferEvent(transferEvent);
            }
          }
        }
      }
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
      const side = row.denom_in === this.TOKEN_DENOM ? "buy" : "sell";
      const swapEvent: PoolSwapEvent = {
        timestamp: new Date(row.ingestion_timestamp.value).getTime(),
        sender: row.sender,
        side,
        amount: side === "buy" ? row.parsed_amount_in : row.parsed_amount_out,
        txhash: row.tx_id,
      };
      await this.insertSwapEvent(swapEvent);
    }
  }

  private async insertMintEvent(event: MintEvent) {
    console.log('Mint Event:', JSON.stringify(event, null, 2));
    await this.clickhouseService.client.insert({
      table: "mint_events",
      values: {
        timestamp: event.timestamp,
        amount: event.amount,
        mint_to_address: event.mint_to_address,
        txhash: event.txhash,
      },
    });
  }

  private async insertBurnEvent(event: BurnEvent) {
    console.log('Burn Event:', JSON.stringify(event, null, 2));
    await this.clickhouseService.client.insert({
      table: "burn_events",
      values: {
        timestamp: event.timestamp,
        amount: event.amount,
        burn_from_address: event.burn_from_address,
        txhash: event.txhash,
      },
    });
  }

  private async insertTransferEvent(event: TransferEvent) {
    console.log('Transfer Event:', JSON.stringify(event, null, 2));
    await this.clickhouseService.client.insert({
      table: "transfer_events",
      values: {
        timestamp: event.timestamp,
        from_address: event.from_address,
        to_address: event.to_address,
        amount: event.amount,
        txhash: event.txhash,
      },
    });
  }

  private async insertSwapEvent(event: PoolSwapEvent) {
    console.log('Pool Swap Event:', JSON.stringify(event, null, 2));
    await this.clickhouseService.client.insert({
      table: "pool_swap_events",
      values: {
        timestamp: event.timestamp,
        sender: event.sender,
        side: event.side,
        amount: event.amount,
        txhash: event.txhash,
      },
    });
  }
}
