import _ from 'lodash';
import { InjectQueue, Processor, WorkerHost } from "@nestjs/bullmq";
import { OnModuleInit } from "@nestjs/common";
import { Job, Queue } from "bullmq";
import axios from "axios";
import Bluebird from "bluebird";

import { ClickhouseService } from "../clickhouse/clickhouse.service.js";
import { ConfigService } from "@nestjs/config";
import { NumiaConfig } from "../config/config.interface.js";
import { PrismaService } from "../prisma/prisma.service.js";
import {
  BurnEvent,
  MintEvent,
  Msg,
  MsgBurn,
  MsgSend,
  MsgSwapExactAmountIn,
  MsgSwapExactAmountInRoute,
  MsgSwapExactAmountOut,
  MsgSwapExactAmountOutRoute,
  PoolSwapEvent,
  TransferEvent,
} from "./types.js";
import { OsmosisRepository } from './OsmosisRepository.js';

@Processor("osmosis-live")
export class OsmosisLiveProcessor extends WorkerHost implements OnModuleInit {
  // private static readonly endpoint =
  //   "https://lcd.osmosis.zone/cosmos/tx/v1beta1/txs";

  private static readonly endpoint = "https://osmosis.numia.xyz/v2/txs";

  private static readonly POOL_ID = "1721";

  private static readonly TOKEN_DENOM =
    "factory/osmo19hdqma2mj0vnmgcxag6ytswjnr8a3y07q7e70p/wLIBRA";

  private readonly numiaApiKey?: string;

  constructor(
    config: ConfigService,

    private readonly clickhouseService: ClickhouseService,

    private readonly prisma: PrismaService,

    @InjectQueue("osmosis-live")
    private readonly osmosisQueue: Queue,

    private readonly osmosisRepository: OsmosisRepository,
  ) {
    super();

    this.numiaApiKey = config.get<NumiaConfig>("numia")?.apiKey;
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
    // await this.osmosisQueue.add("fetchLiveData", undefined, {
    //   repeat: {
    //     every: 60 * 30 * 1_000, // 1 minute
    //   },
    // });
    // await this.fetchAndStoreLiveData();
  }

  public async triggerFetchLiveData() {
    // await this.osmosisQueue.add("fetchLiveData", undefined);
    // await this.fetchAndStoreLiveData();
  }

  public async fetchAndStoreLiveData() {
    let offset = 0;

    while (true) {
      const mintEvents: MintEvent[] = [];

      const url = `${OsmosisLiveProcessor.endpoint}/osmo19hdqma2mj0vnmgcxag6ytswjnr8a3y07q7e70p?offset=${offset}`;
      console.log(url);

      const response = await axios<
        {
          _id: string;
          hash: string;
          blockTimestamp: string;
          index: number;
          height: number;
          addressIndex: string[];
          messageTypes: string[];
          messages: Msg[];
        }[]
      >({
        url,
        headers: {
          Authorization: `Bearer ${this.numiaApiKey}`,
        },
      });

      const transactions = response.data;
      if (!transactions.length) {
        break;
      }

      for (const tx of transactions) {
        const txHash = Buffer.from(tx.hash, 'hex');

        const date = new Date(tx.blockTimestamp);
        // const timestamp = date.getTime();
        for (const [index, msg] of tx.messages.entries()) {
          switch (msg["@type"]) {
            case "/osmosis.poolmanager.v1beta1.MsgSwapExactAmountIn":
            case "/osmosis.poolmanager.v1beta1.MsgSwapExactAmountOut":
              console.log("/osmosis.poolmanager.v1beta1.MsgSwapExactAmountIn/out");
              console.dir(tx, { depth: 10 });

              // await this.handlePoolSwapEvent(
              //   msg,
              //   timestamp,
              //   tx.hash,
              //   index,
              // );
              break;

            case "/osmosis.tokenfactory.v1beta1.MsgMint":
              if (msg.amount.denom === OsmosisLiveProcessor.TOKEN_DENOM) {
                mintEvents.push({
                  date,
                  amount: BigInt(msg.amount.amount),
                  mint_to_address: msg.mint_to_address,
                  txHash,
                  index,
                });
              }
              break;

            case "/osmosis.tokenfactory.v1beta1.MsgBurn":
              await this.handleBurnEvent(msg, date, txHash, index);
              break;

            case "/cosmos.bank.v1beta1.MsgSend":
              console.log("/cosmos.bank.v1beta1.MsgSend");
              console.dir(tx, { depth: 10 });

              // await this.handleTransferEvent(
              //   msg,
              //   timestamp,
              //   tx.hash,
              //   index,
              // );
              break;
          }
        }
      }

      await this.osmosisRepository.insertMintEvents(mintEvents);

      // Delay the next request by 3 seconds
      await new Promise((resolve) => setTimeout(resolve, 3000));

      offset += transactions.length;

      break;
    }
  }

  private async handlePoolSwapEvent(
    msg: MsgSwapExactAmountIn | MsgSwapExactAmountOut,
    date: Date,
    txHash: Uint8Array,
    index: number,
  ) {
    // Check if pool_id exists in the routes
    const relevantRoute = msg.routes.find(
      (route) => route.pool_id === OsmosisLiveProcessor.POOL_ID,
    );
    if (!relevantRoute) {
      return;
    }

    switch (msg["@type"]) {
      case "/osmosis.poolmanager.v1beta1.MsgSwapExactAmountOut":
        {
          const { token_out } = msg;
          if (token_out.denom === OsmosisLiveProcessor.TOKEN_DENOM) {
            await this.osmosisRepository.insertSwapEvent({
              date,
              sender: msg.sender,
              side: "buy",
              amount: BigInt(token_out.amount),
              txHash,
              index,
            });
          } else if (
            (relevantRoute as MsgSwapExactAmountOutRoute).token_in_denom ===
            OsmosisLiveProcessor.TOKEN_DENOM
          ) {
            await this.osmosisRepository.insertSwapEvent({
              date,
              sender: msg.sender,
              side: "sell",
              amount: BigInt(msg.token_in_max_amount),
              txHash,
              index,
            });
          }
        }
        break;

      case "/osmosis.poolmanager.v1beta1.MsgSwapExactAmountIn":
        {
          const { token_in } = msg;
          if (token_in.denom === OsmosisLiveProcessor.TOKEN_DENOM) {
            await this.osmosisRepository.insertSwapEvent({
              date,
              sender: msg.sender,
              side: "sell",
              amount: BigInt(token_in.amount),
              txHash,
              index,
            });
          } else if (
            (relevantRoute as MsgSwapExactAmountInRoute).token_out_denom ===
            OsmosisLiveProcessor.TOKEN_DENOM
          ) {
            await this.osmosisRepository.insertSwapEvent({
              date,
              sender: msg.sender,
              side: "buy",
              amount: BigInt(msg.token_out_min_amount),
              txHash,
              index,
            });
          }
        }
        break;
    }
  }

  private async handleBurnEvent(
    msg: MsgBurn,
    date: Date,
    txHash: Uint8Array,
    index: number,
  ) {
    if (msg.amount.denom === OsmosisLiveProcessor.TOKEN_DENOM) {
      await this.osmosisRepository.insertBurnEvent({
        date,
        amount: BigInt(msg.amount.amount),
        burn_from_address: msg.burn_from_address,
        txHash,
        index,
      });
    }
  }

  private async handleTransferEvent(
    msg: MsgSend,
    date: Date,
    txHash: Uint8Array,
    index: number,
  ) {
    const transferAmounts = msg.amount.filter(
      (amount) => amount.denom === OsmosisLiveProcessor.TOKEN_DENOM,
    );
    if (transferAmounts.length === 0) {
      return;
    }

    for (const amount of transferAmounts) {
      await this.osmosisRepository.insertTransferEvent({
        date,
        from_address: msg.from_address,
        to_address: msg.to_address,
        amount: amount.amount,
        txHash,
        index,
      });
    }
  }

}
