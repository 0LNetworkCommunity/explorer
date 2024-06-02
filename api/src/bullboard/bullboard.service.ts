import { Injectable } from '@nestjs/common';
import { Queue } from 'bullmq';
import { createBullBoard } from '@bull-board/api';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter.js';
import { ExpressAdapter } from '@bull-board/express';

@Injectable()
export class BullBoardService {

  private readonly serverAdapter: ExpressAdapter;

  constructor() {
    this.serverAdapter = new ExpressAdapter();
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