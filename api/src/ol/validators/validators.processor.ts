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
    await this.validatorsQueue.add('updateValidatorsHandlersCache', undefined, {
      repeat: {
        every: 12 * 60 * 60 * 1000, // 12 hours
      },
    });
    this.updateValidatorsHandlersCache();

    await this.validatorsQueue.add('updateValidatorsCache', undefined, {
      repeat: {
        every: 30 * 1000, // 30 seconds
      },
    });
    this.updateValidatorsCache();

    await this.validatorsQueue.add('updateVfnStatusCache', undefined, {
      repeat: {
        every: 5 * 60 * 1000, // 5 minutes
      },
    });
    this.updateVfnStatusCache();

    await this.validatorsQueue.add('updateValidatorsVouchesCache', undefined, {
      repeat: {
        every: 60 * 1000, // 60 seconds
      },
    });
    this.updateValidatorsVouchesCache();

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

  private async updateVfnStatusCache() {
    try {
      const vfnStatus = await this.validatorsService.queryValidatorsVfnStatus();
      await redisClient.set(VALIDATORS_VFN_STATUS_CACHE_KEY, JSON.stringify(vfnStatus));
      this.logger.log('VFN status cache updated');
    } catch (error) {
      this.logger.error('Error updating VFN status cache', error);
    }
  }

  private async updateValidatorsCache() {
    try {
      const validators = await this.validatorsService.queryValidators();
      await redisClient.set(VALIDATORS_CACHE_KEY, JSON.stringify(validators));
      this.logger.log('Validators cache updated');
    } catch (error) {
      this.logger.error('Error updating validators cache', error);
    }
  }

  private async updateValidatorsHandlersCache() {
    try {
      const validatorsHandlers = await this.validatorsService.loadValidatorHandles();
      await redisClient.set(
        VALIDATORS_HANDLERS_CACHE_KEY,
        JSON.stringify(JSON.stringify(Array.from(validatorsHandlers.entries()))),
      );
      this.logger.log('Validators handlers cache updated');
    } catch (error) {
      this.logger.error('Error updating validators handlers cache', error);
    }
  }

  private async updateValidatorsVouchesCache() {
    try {
      const validatorsVouches = await this.validatorsService.queryValidatorsVouches();
      await redisClient.set(VALIDATORS_VOUCHES_CACHE_KEY, JSON.stringify(validatorsVouches));
    } catch (error) {
      this.logger.error('Error updating validators vouches cache', error);
    }
  }
}
