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

@Processor("base-live")
export class BaseLiveProcessor extends WorkerHost implements OnModuleInit {
  private readonly endpoint = 'https://base.blockscout.com/api/v2/tokens/0xc78b628b060258300218740b1a7a5b3c82b3bd9f/transfers';

  constructor(
    private readonly clickhouseService: ClickhouseService,

    @InjectQueue("base-live")
    private readonly baseQueue: Queue,
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
    // await this.baseQueue.add("fetchLiveData", undefined, {
    //   repeat: {
    //     every: 60 * 30 * 1_000, // 1 minute
    //   },
    // });
    // await this.fetchAndStoreLiveData();
  }

  public async triggerFetchLiveData() {
    // await this.baseQueue.add("fetchLiveData", undefined);
    await this.fetchAndStoreLiveData();
  }

  private async fetchAndStoreLiveData() {
    try {
      const response = await axios.get(this.endpoint);
      if (response.status !== 200) {
        console.error(`Error fetching data from URL: ${this.endpoint}, Status Code: ${response.status}`);
        return;
      }

      const events = response.data.items;
      for (const event of events) {
        const timestamp = new Date(event.timestamp).getTime();
        const txhash = event.tx_hash;
        const amount = event.total.value;

        switch (event.type) {
          case "token_minting":
            await this.handleMintEvent(event, timestamp, txhash, amount);
            break;
          case "token_burning":
            await this.handleBurnEvent(event, timestamp, txhash, amount);
            break;
          case "token_transfer":
            await this.handleTransferEvent(event, timestamp, txhash, amount);
            break;
        }
      }
    } catch (error) {
      console.error(`Error fetching data from URL: ${this.endpoint}`, error.message || error);
    }
  }

  private async handleMintEvent(event, timestamp: number, txhash: string, amount: string) {
    const mintEvent: MintEvent = {
      timestamp,
      amount,
      mint_to_address: event.to.hash,
      txhash
    };
    await this.insertMintEvent(mintEvent);
  }

  private async handleBurnEvent(event, timestamp: number, txhash: string, amount: string) {
    const burnEvent: BurnEvent = {
      timestamp,
      amount,
      burn_from_address: event.from.hash,
      txhash
    };
    await this.insertBurnEvent(burnEvent);
  }

  private async handleTransferEvent(event, timestamp: number, txhash: string, amount: string) {
    const transferEvent: TransferEvent = {
      timestamp,
      from_address: event.from.hash,
      to_address: event.to.hash,
      amount,
      txhash,
    };
    await this.insertTransferEvent(transferEvent);
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
