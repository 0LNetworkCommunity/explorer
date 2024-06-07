import { Injectable } from '@nestjs/common';
import { Queue } from 'bullmq';
import { createBullBoard } from '@bull-board/api';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter.js';
import { ExpressAdapter } from '@bull-board/express';
import { redisClient } from "../redis/redis.service.js";

@Injectable()
export class BullBoardService {

  private readonly serverAdapter: ExpressAdapter;
  private readonly queueNames: string[] = [
    "ol-clickhouse-ingestor",
    "ol-parquet-producer",
    "ol-version-batch",
    "ol-version",
    "expired-transactions",
    "ol-swap",
    "node-watcher",
    "wallet-subscription",
    "stats"
  ];

  constructor() {
    this.serverAdapter = new ExpressAdapter();
  }

  onModuleInit() {
    if (process.env.NODE_ENV !== 'production') {
      this.setupBullBoard(
        this.queueNames.map(name => ({
          name,
          connection: redisClient,
        }))
      );
    }
  }

  setupBullBoard(queueConfigs: { name: string; connection: any }[]) {
    const queues: Queue<any, any, string>[] = queueConfigs.map(
      (config) => new Queue(config.name, { connection: config.connection })
    );

    createBullBoard({
      queues: queues.map((queue) => new BullMQAdapter(queue)),
      serverAdapter: this.serverAdapter,
    });

    this.serverAdapter.setBasePath('/ui');
  }

  getServerAdapter() {
    return this.serverAdapter;
  }

}