import _ from 'lodash';
import { InjectQueue, Processor, WorkerHost } from '@nestjs/bullmq';
import { Inject, OnModuleInit } from '@nestjs/common';
import { Job, Queue } from 'bullmq';
import { ICommunityWalletsService } from './interfaces.js';
import { redisClient } from '../../redis/redis.service.js';
import { Types } from '../../types.js';

import { COMMUNITY_WALLETS_CACHE_KEY } from '../constants.js';

@Processor('community-wallets')
export class CommunityWalletsProcessor extends WorkerHost implements OnModuleInit {
  public constructor(
    @InjectQueue('community-wallets')
    private readonly communityWalletsQueue: Queue,

    @Inject(Types.ICommunityWalletsService)
    private readonly communityWalletsService: ICommunityWalletsService,
  ) {
    super();
  }

  public async onModuleInit() {
    await this.communityWalletsQueue.add('updateCommunityWalletsCaches', undefined, {
      repeat: {
        every: 60 * 60 * 1_000, // 1 hour
      },
    });

    // Execute the job immediately on startup
    await this.updateCommunityWalletsCaches();
  }

  public async process(job: Job<void, any, string>) {
    switch (job.name) {
      case 'updateCommunityWalletsCache':
        await this.updateCommunityWalletsCaches();
        break;

      default:
        throw new Error(`invalid job name ${job.name}`);
    }
  }

  private async updateCommunityWalletsCaches() {
    await this.communityWalletsService.updateAllCaches();
  }
}
