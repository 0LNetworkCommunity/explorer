import { InjectQueue, Processor, WorkerHost } from '@nestjs/bullmq';
import { OnModuleInit } from '@nestjs/common';
import { Job, Queue } from 'bullmq';

import { AccountsService } from './accounts.service.js';
import { redisClient } from '../../redis/redis.service.js';
import { TOP_BALANCE_ACCOUNTS_CACHE_KEY } from '../constants.js';

@Processor('accounts')
export class AccountsProcessor extends WorkerHost implements OnModuleInit {
  public constructor(
    @InjectQueue('accounts')
    private readonly accountsQueue: Queue,

    private readonly accountsService: AccountsService,
  ) {
    super();
  }

  public async onModuleInit() {
    await this.accountsQueue.add('updateAccountsCache', undefined, {
      repeat: {
        every: 60 * 60 * 1_000, // 1 hour
      },
    });
  }

  public async process(job: Job<void, any, string>) {
    switch (job.name) {
      case 'updateAccountsCache':
        await this.updateAccountsCache();
        break;

      default:
        throw new Error(`invalid job name ${job.name}`);
    }
  }

  private async updateAccountsCache() {
    const accounts = await this.accountsService.getTopBalanceAccounts(100);
    await redisClient.set(TOP_BALANCE_ACCOUNTS_CACHE_KEY, JSON.stringify(accounts));
  }
}
