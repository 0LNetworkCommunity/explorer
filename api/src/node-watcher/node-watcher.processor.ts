import { InjectQueue, Processor, WorkerHost } from '@nestjs/bullmq';
import _ from 'lodash';
import { OnModuleInit } from '@nestjs/common';
import { Job, Queue } from 'bullmq';

import { NodeWatcherService } from './node-watcher.service.js';

@Processor('node-watcher')
export class NodeWatcherProcessor extends WorkerHost implements OnModuleInit {
  public constructor(
    @InjectQueue('node-watcher')
    private readonly nodeWatcherQueue: Queue,
    private readonly nodeWatcherService: NodeWatcherService,
  ) {
    super();
  }

  public async onModuleInit() {
    await this.nodeWatcherQueue.add('updateValidators', undefined, {
      removeOnComplete: {
        age: 60 * 60,
      },
      removeOnFail: {
        age: 60 * 60,
      },
      repeat: {
        every: 30 * 60 * 1_000, // 30 minutes
      },
    });

    await this.nodeWatcherQueue.add('checkNodes', undefined, {
      removeOnComplete: {
        age: 10,
      },
      removeOnFail: {
        age: 10,
      },
      repeat: {
        every: 30 * 1_000, // 30 seconds
      },
    });
  }

  private async checkNodes() {
    await this.nodeWatcherService.checkNodes();
  }

  private async updateValidators() {
    await this.nodeWatcherService.updateValidatorsList();
    await this.nodeWatcherService.updateValidatorLocations();
  }

  public async process(job: Job<any, any, string>) {
    switch (job.name) {
      case 'updateValidators':
        await this.updateValidators();
        break;
      case 'checkNodes':
        await this.checkNodes();
        break;

      default:
        throw new Error(`invalid job name ${job.name}`);
    }
  }
}
