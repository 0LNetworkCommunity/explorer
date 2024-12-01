// src/validators/validators.processor.ts
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue, Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { redisClient } from '../../redis/redis.service.js';
import { ValidatorsService } from './validators.service.js';
import {
  VALIDATORS_CACHE_KEY,
  VALIDATORS_VOUCHES_CACHE_KEY,
  VALIDATORS_VFN_STATUS_CACHE_KEY,
  VALIDATORS_HANDLERS_CACHE_KEY,
} from '../constants.js';

@Processor('validators')
export class ValidatorsProcessor extends WorkerHost {
  private readonly logger = new Logger(ValidatorsProcessor.name);
  public constructor(
    @InjectQueue('validators')
    private readonly validatorsQueue: Queue,
    private readonly validatorsService: ValidatorsService,
  ) {
    super();
  }

  public async onModuleInit() {
    // Note: this order is important
    await this.updateValidatorsHandlersCache();
    await this.updateVfnStatusCache();
    await this.updateValidatorsCache();
    await this.updateValidatorsVouchesCache();

    // Clear all jobs in the queue
    this.validatorsQueue.drain(true);

    await this.validatorsQueue.add('updateValidatorsHandlersCache', undefined, {
      repeat: {
        every: 12 * 60 * 60 * 1000, // 12 hours
      },
    });

    await this.validatorsQueue.add('updateValidatorsCache', undefined, {
      repeat: {
        every: 30 * 1000, // 30 seconds
      },
    });

    await this.validatorsQueue.add('updateVfnStatusCache', undefined, {
      repeat: {
        every: 5 * 60 * 1000, // 5 minutes
      },
    });

    await this.validatorsQueue.add('updateValidatorsVouchesCache', undefined, {
      repeat: {
        every: 60 * 1000, // 60 seconds
      },
    });

    this.logger.log('ValidatorsProcessor initialized');
  }

  public async process(job: Job<void, any, string>) {
    switch (job.name) {
      case 'updateValidatorsCache':
        await this.updateValidatorsCache();
        break;
      case 'updateValidatorsHandlersCache':
        await this.updateValidatorsHandlersCache();
        break;
      case 'updateValidatorsVouchesCache':
        await this.updateValidatorsVouchesCache();
        break;
      case 'updateVfnStatusCache':
        await this.updateVfnStatusCache();
        break;

      default:
        throw new Error(`Invalid job name ${job.name}`);
    }
  }

  private async updateValidatorsHandlersCache() {
    const start = Date.now();
    try {
      const validatorsHandlers = await this.validatorsService.loadValidatorHandles();
      const obj = Object.fromEntries(validatorsHandlers);
      await redisClient.set(VALIDATORS_HANDLERS_CACHE_KEY, JSON.stringify(obj));
      const duration = Date.now() - start;
      this.logger.log(`Validators handlers cache updated in ${duration}ms`);
    } catch (error) {
      this.logger.error('Error updating validators handlers cache', error);
    }
  }

  private async updateVfnStatusCache() {
    const start = Date.now();
    try {
      const vfnStatus = await this.validatorsService.queryValidatorsVfnStatus();
      await redisClient.set(VALIDATORS_VFN_STATUS_CACHE_KEY, JSON.stringify(vfnStatus));
      const duration = Date.now() - start;
      this.logger.log(`VFN status cache updated in ${duration}ms`);
    } catch (error) {
      this.logger.error('Error updating VFN status cache', error);
    }
  }

  private async updateValidatorsCache() {
    const start = Date.now();
    try {
      const validators = await this.validatorsService.queryValidators();
      await redisClient.set(VALIDATORS_CACHE_KEY, JSON.stringify(validators));
      this.logger.debug(`Wrote this to the cache: ${JSON.stringify(validators).slice(0, 200)}`)
      const duration = Date.now() - start;
      this.logger.log(`Validators cache updated in ${duration}ms`);
    } catch (error) {
      this.logger.error('Error updating validators cache', error);
    }
  }

  private async updateValidatorsVouchesCache() {
    const start = Date.now();
    try {
      const validatorsVouches = await this.validatorsService.queryValidatorsVouches();
      await redisClient.set(VALIDATORS_VOUCHES_CACHE_KEY, JSON.stringify(validatorsVouches));
      const duration = Date.now() - start;
      this.logger.log(`Validators vouches cache updated in ${duration}ms`);
    } catch (error) {
      this.logger.error('Error updating validators vouches cache', error);
    }
  }
}
