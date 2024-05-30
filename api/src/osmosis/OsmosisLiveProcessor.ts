import { InjectQueue, Processor, WorkerHost } from "@nestjs/bullmq";
import { OnModuleInit } from "@nestjs/common";
import { Job, Queue } from "bullmq";
import axios from "axios";
import Bluebird from "bluebird";

import { ClickhouseService } from "../clickhouse/clickhouse.service.js";

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

@Processor("osmosis-live")
export class OsmosisLiveProcessor extends WorkerHost implements OnModuleInit {
  private readonly endpoint = 'https://lcd.osmosis.zone/cosmos/tx/v1beta1/txs';
  private readonly POOL_ID = '1721';
  private readonly TOKEN_DENOM = 'factory/osmo19hdqma2mj0vnmgcxag6ytswjnr8a3y07q7e70p/wLIBRA';

  constructor(
    private readonly clickhouseService: ClickhouseService,

    @InjectQueue("osmosis-live")
    private readonly osmosisQueue: Queue,
  ) {
    super();
  }

  public async process(job: Job<any, any, string>): Promise<any> {
    switch (job.name) {
      case "fetchLiveData":
        try {
          await Promise.race([
            this.fetchAndStoreLiveData(),
            // 30m timeout to avoid blocking the queue
            Bluebird.delay(60 * 30 * 1_000),
          ]);
        } catch (error) {
          // fail silently to avoid accumulating failed repeating jobs
        }
        break;

      default:
        throw new Error(`invalid job name ${job.name}`);
    }
  }

  public async onModuleInit() {
    await this.osmosisQueue.add("fetchLiveData", undefined, {
      repeat: {
        every: 60 * 30 * 1_000, // 1 minute
      },
    });
    await this.fetchAndStoreLiveData();
  }

  public async triggerFetchLiveData() {
    // await this.osmosisQueue.add("fetchLiveData", undefined);
    // await this.fetchAndStoreLiveData();
  }

  private async fetchAndStoreLiveData() {
    const events = [
      '/osmosis.poolmanager.v1beta1.MsgSwapExactAmountIn',
      '/osmosis.poolmanager.v1beta1.MsgSwapExactAmountOut',
      '/osmosis.tokenfactory.v1beta1.MsgMint',
      '/osmosis.tokenfactory.v1beta1.MsgBurn',
      '/cosmos.bank.v1beta1.MsgSend',
    ];

    for (const event of events) {
      for (let page = 1; page <= 5; page++) {
        const url = `${this.endpoint}?events=message.action='${event}'&limit=100&page=${page}`;
        console.log(url);

        try {
          const response = await axios.get(url);
          if (response.status !== 200) {
            console.error(`Error fetching data from URL: ${url}, Status Code: ${response.status}`);
            continue;
          }

          const transactions = response.data.tx_responses;
          for (const tx of transactions) {
            const timestamp = new Date(tx.timestamp).getTime();
            const txhash = tx.txhash;
            for (const msg of tx.tx.body.messages) {
              if (msg['@type'] === '/osmosis.poolmanager.v1beta1.MsgSwapExactAmountIn' || msg['@type'] === '/osmosis.poolmanager.v1beta1.MsgSwapExactAmountOut') {
                await this.handlePoolSwapEvent(msg, timestamp, txhash);
              } else if (msg['@type'] === '/osmosis.tokenfactory.v1beta1.MsgMint') {
                // await this.handleMintEvent(msg, timestamp, txhash);
              } else if (msg['@type'] === '/osmosis.tokenfactory.v1beta1.MsgBurn') {
                await this.handleBurnEvent(msg, timestamp, txhash);
              } else if (msg['@type'] === '/cosmos.bank.v1beta1.MsgSend') {
                await this.handleTransferEvent(msg, timestamp, txhash);
              }
            }
          }
        } catch (error) {
          console.error(`Error fetching data from URL: ${url}`, error.message || error);
          continue;
        }
        // Delay the next request by 3 seconds
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
    }
  }

  private async handlePoolSwapEvent(msg, timestamp: number, txhash: string) {
    const { routes, token_in, token_out } = msg;

    // Check if pool_id 1721 exists in the routes
    const relevantRoute = routes.find(route => route.pool_id === '1721');
    if (!relevantRoute) return;

    if (msg['@type'] === '/osmosis.poolmanager.v1beta1.MsgSwapExactAmountOut') {
      if (token_out.denom === 'factory/osmo19hdqma2mj0vnmgcxag6ytswjnr8a3y07q7e70p/wLIBRA') {
        const side = 'buy';
        const amount = token_out.amount;
        await this.insertSwapEvent({ timestamp, sender: msg.sender, side, amount, txhash });
      } else if (relevantRoute.token_in_denom === 'factory/osmo19hdqma2mj0vnmgcxag6ytswjnr8a3y07q7e70p/wLIBRA') {
        const side = 'sell';
        const amount = msg.token_in_max_amount;
        await this.insertSwapEvent({ timestamp, sender: msg.sender, side, amount, txhash });
      }
    } else if (msg['@type'] === '/osmosis.poolmanager.v1beta1.MsgSwapExactAmountIn') {
      if (token_in.denom === 'factory/osmo19hdqma2mj0vnmgcxag6ytswjnr8a3y07q7e70p/wLIBRA') {
        const side = 'sell';
        const amount = token_in.amount;
        await this.insertSwapEvent({ timestamp, sender: msg.sender, side, amount, txhash });
      } else if (relevantRoute.token_out_denom === 'factory/osmo19hdqma2mj0vnmgcxag6ytswjnr8a3y07q7e70p/wLIBRA') {
        const side = 'buy';
        const amount = msg.token_out_min_amount;
        await this.insertSwapEvent({ timestamp, sender: msg.sender, side, amount, txhash });
      }
    }
  }

  private async handleMintEvent(msg, timestamp: number, txhash: string) {
    if (msg.amount.denom !== 'factory/osmo19hdqma2mj0vnmgcxag6ytswjnr8a3y07q7e70p/wLIBRA') return;
    const mintEvent: MintEvent = {
      timestamp,
      amount: msg.amount.amount,
      mint_to_address: msg.mintToAddress,
      txhash
    };
    await this.insertMintEvent(mintEvent);
  }

  private async handleBurnEvent(msg, timestamp: number, txhash: string) {
    if (msg.amount.denom !== 'factory/osmo19hdqma2mj0vnmgcxag6ytswjnr8a3y07q7e70p/wLIBRA') return;
    const burnEvent: BurnEvent = {
      timestamp,
      amount: msg.amount.amount,
      burn_from_address: msg.burnFromAddress,
      txhash
    };
    await this.insertBurnEvent(burnEvent);
  }

  private async handleTransferEvent(msg, timestamp: number, txhash: string) {
    const transferAmounts = msg.amount.filter(amount => amount.denom === 'factory/osmo19hdqma2mj0vnmgcxag6ytswjnr8a3y07q7e70p/wLIBRA');
    if (transferAmounts.length === 0) return;

    for (const amount of transferAmounts) {
      const transferEvent: TransferEvent = {
        timestamp,
        from_address: msg.from_address,
        to_address: msg.to_address,
        amount: amount.amount,
        txhash,
      };
      await this.insertTransferEvent(transferEvent);
    }
  }

  private async insertSwapEvent(event: PoolSwapEvent) {
    console.log('Pool Swap Event:', JSON.stringify(event, null, 2));
    /*
    await this.clickhouseService.client.insert({
      table: 'pool_swap_events',
      values: {
        timestamp: event.timestamp,
        sender: event.sender,
        side: event.side,
        amount: event.amount,
        txhash: event.txhash,
      }
    });
    */
  }

  private async insertMintEvent(event: MintEvent) {
    console.log('Mint Event:', JSON.stringify(event, null, 2));
    /*
    await this.clickhouseService.client.insert({
      table: 'mint_events',
      values: {
        timestamp: event.timestamp,
        amount: event.amount,
        mint_to_address: event.mint_to_address,
        txhash: event.txhash,
      }
    });
    */
  }

  private async insertBurnEvent(event: BurnEvent) {
    console.log('Burn Event:', JSON.stringify(event, null, 2));
    /*
    await this.clickhouseService.client.insert({
      table: 'burn_events',
      values: {
        timestamp: event.timestamp,
        amount: event.amount,
        burn_from_address: event.burn_from_address,
        txhash: event.txhash,
      }
    });
    */
  }

  private async insertTransferEvent(event: TransferEvent) {
    console.log('Transfer Event:', JSON.stringify(event, null, 2));
    /*
    await this.clickhouseService.client.insert({
      table: 'transfer_events',
      values: {
        timestamp: event.timestamp,
        from_address: event.from_address,
        to_address: event.to_address,
        amount: event.amount,
        txhash: event.txhash,
      }
    });
    */
  }
}
