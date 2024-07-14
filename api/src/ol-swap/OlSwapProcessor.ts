import { InjectQueue, Processor, WorkerHost } from '@nestjs/bullmq';
import { OnModuleInit } from '@nestjs/common';
import { Job, Queue } from 'bullmq';
import axios from 'axios';
import { stringify as csvStringify } from 'csv-stringify/sync';
import { ClickhouseService } from '../clickhouse/clickhouse.service.js';
import Bluebird from 'bluebird';

interface ChartData {
  date: number;
  open: string;
  high: number;
  low: number;
  close: string;
  volume: number;
}

@Processor('ol-swap')
export class OlSwapProcessor extends WorkerHost implements OnModuleInit {
  public constructor(
    private readonly clickhouseService: ClickhouseService,

    @InjectQueue('ol-swap')
    private readonly olVersionQueue: Queue,
  ) {
    super();
  }

  public async process(job: Job<any, any, string>): Promise<any> {
    switch (job.name) {
      case 'getHistory':
        try {
          await Promise.race([
            this.getHistory(),
            // 1m timeout to avoid blocking the queue
            Bluebird.delay(60 * 60 * 1_000),
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
    await this.olVersionQueue.add('getHistory', undefined, {
      repeat: {
        every: 30 * 60 * 1_000, // 30 minutes
      },
    });
    await this.getHistory();
  }

  private async getHistory() {
    const res = await axios<ChartData[]>({
      url: 'https://api.0lswap.com/orders/getChartData?interval=1h&market=OLUSDT',
      signal: AbortSignal.timeout(5 * 60 * 1_000), // 5 minutes
    });
    await this.insertHistory(res.data);
  }

  private async insertHistory(data: ChartData[]) {
    const payload = csvStringify(
      data.map((it) => [it.date, it.volume, it.open, it.high, it.low, it.close]),
    );

    await this.clickhouseService.client.command({
      query: `
        INSERT INTO "ol_swap_1h" (
          "timestamp",
          "volume",
          "open",
          "high",
          "low",
          "close"
        )
        SELECT
          "timestamp",
          "volume",
          "open",
          "high",
          "low",
          "close"
        FROM
          format(
            CSV,
            $$
              "timestamp" UInt64,
              "volume" Decimal64(6),
              "open" Decimal64(6),
              "high" Decimal64(6),
              "low" Decimal64(6),
              "close" Decimal64(6)
            $$,
            $$${payload}$$
          )
      `,
    });
  }
}
