// src/validators/validators.processor.ts
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue, Job } from 'bullmq';
import { redisClient } from '../../redis/redis.service.js';
import { ValidatorsService } from './validators.service.js';
import { VALIDATORS_CACHE_KEY, VALIDATORS_VOUCHES_CACHE_KEY } from '../constants.js';

@Processor('validators')
export class ValidatorsProcessor extends WorkerHost {
  public constructor(
    @InjectQueue('validators')
    private readonly validatorsQueue: Queue,
    private readonly validatorsService: ValidatorsService,
  ) {
    super();
  }

  public async onModuleInit() {
    await this.validatorsQueue.add('updateValidatorsCache', undefined, {
      repeat: {
        every: 30 * 1000, // 30 seconds
      },
    });
    this.updateValidatorsCache();

    await this.validatorsQueue.add('updateValidatorsVouchesCache', undefined, {
      repeat: {
        every: 60 * 1000, // 60 seconds
      },
    });
    this.updateValidatorsVouchesCache();
  }

  public async process(job: Job<void, any, string>) {
    switch (job.name) {
      case 'updateValidatorsCache':
        await this.updateValidatorsCache();
        break;

      default:
        throw new Error(`Invalid job name ${job.name}`);
    }
  }

  private async updateValidatorsCache() {
    const validators = await this.validatorsService.queryValidators();
    await redisClient.set(VALIDATORS_CACHE_KEY, JSON.stringify(validators));
  }

  private async updateValidatorsVouchesCache() {
    const validatorsVouches = await this.validatorsService.queryValidatorsVouches();
    await redisClient.set(VALIDATORS_VOUCHES_CACHE_KEY, JSON.stringify(validatorsVouches));
  }
}
