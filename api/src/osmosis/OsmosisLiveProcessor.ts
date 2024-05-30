import { InjectQueue, Processor, WorkerHost } from "@nestjs/bullmq";
import { OnModuleInit } from "@nestjs/common";
import { Job, Queue } from "bullmq";
import axios from "axios";
import Bluebird from "bluebird";

import { ClickhouseService } from "../clickhouse/clickhouse.service.js";

interface PoolSwapEvent {
  timestamp: number;
  pool_id: string;
  token_out_denom: string;
  token_in_denom: string;
  side: string;
  amount: string;
}

interface MintBurnTransferEvent {
  timestamp: number;
  type: string;
  amount: string;
  address: string;
}

@Processor("osmosis-live")
export class OsmosisLiveProcessor extends WorkerHost implements OnModuleInit {
  private readonly endpoint = 'https://lcd.osmosis.zone/cosmos/tx/v1beta1/txs';

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
            // 1m timeout to avoid blocking the queue
            Bluebird.delay(60 * 1_000),
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
    // await this.fetchAndStoreLiveData();
  }

  public async triggerFetchLiveData() {
    // await this.osmosisQueue.add("fetchLiveData", undefined);
    await this.fetchAndStoreLiveData();
  }

  private async fetchAndStoreLiveData() {
    const events = [
      // '/osmosis.poolmanager.v1beta1.SwapAmountInRoute',
      // '/osmosis.poolmanager.v1beta1.SwapAmountOutRoute',
      '/osmosis.gamm.v1beta1.MsgSwapExactAmountIn',
      '/osmosis.gamm.v1beta1.MsgSwapExactAmountOut',
      '/osmosis.tokenfactory.v1beta1.MsgMint',
      '/cosmos.bank.v1beta1.MsgSend',
    ];

    for (const event of events) {
      const url = `${this.endpoint}?events=${event}`;
      console.log(url)
      const response = await axios.get(url);
      const transactions = response.data.tx_responses;

      for (const tx of transactions) {
        for (const log of tx.logs) {
          for (const msg of log.events) {
            if (msg.type === '/osmosis.gamm.v1beta1.MsgSwapExactAmountIn' || msg.type === '/osmosis.gamm.v1beta1.MsgSwapExactAmountOut') {
              await this.handlePoolSwapEvent(msg);
            } else if (msg.type === '/osmosis.tokenfactory.v1beta1.MsgMint' || msg.type === '/cosmos.bank.v1beta1.MsgSend') {
              await this.handleMintBurnTransferEvent(msg);
            }
          }
        }
      }
    }
  }

  private async handlePoolSwapEvent(event) {
    const { pool_id, token_out_denom, token_in_denom } = event.attributes.reduce((acc, attr) => {
      acc[attr.key] = attr.value;
      return acc;
    }, {});

    const timestamp = new Date(event.timestamp).getTime();
    const side = token_in_denom === 'factory/osmo19hdqma2mj0vnmgcxag6ytswjnr8a3y07q7e70p/wLIBRA' ? 'buy' : 'sell';
    const amount = side === 'buy' ? event.amount_in : event.amount_out;

    await this.insertSwapEvent({ timestamp, pool_id, token_out_denom, token_in_denom, side, amount });
  }

  private async handleMintBurnTransferEvent(event) {
    const type = event.type.includes('Mint') ? 'mint' : 'burn';
    const { amount, address } = event.attributes.reduce((acc, attr) => {
      if (attr.key === 'amount') acc.amount = attr.value;
      if (attr.key === 'address') acc.address = attr.value;
      return acc;
    }, {});

    const timestamp = new Date(event.timestamp).getTime();

    await this.insertMintBurnTransferEvent({ timestamp, type, amount, address });
  }

  private async insertSwapEvent(event: PoolSwapEvent) {
    console.log('Pool Swap Event:', event);
    /*
    await this.clickhouseService.client.insert({
      table: 'pool_swap_events',
      values: {
        timestamp: event.timestamp,
        pool_id: event.pool_id,
        token_out_denom: event.token_out_denom,
        token_in_denom: event.token_in_denom,
        side: event.side,
        amount: event.amount,
      }
    });
    */
  }

  private async insertMintBurnTransferEvent(event: MintBurnTransferEvent) {
    console.log('Mint/Burn Transfer Event:', event);
    /*
    await this.clickhouseService.client.insert({
      table: 'mint_burn_transfer_events',
      values: {
        timestamp: event.timestamp,
        type: event.type,
        amount: event.amount,
        address: event.address,
      }
    });
    */
  }
}
