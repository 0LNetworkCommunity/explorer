import { ConfigService } from '@nestjs/config';
import { Query, Resolver } from '@nestjs/graphql';

import { ValidatorsService } from './validators.service.js';
import { Validator } from '../models/validator.model.js';
import { redisClient } from '../../redis/redis.service.js';
import { VALIDATORS_CACHE_KEY } from '../constants.js';

@Resolver(() => Validator)
export class ValidatorsResolver {
  private cacheEnabled: boolean;

  public constructor(
    private readonly validatorsService: ValidatorsService,
    config: ConfigService,
  ) {
    this.cacheEnabled = config.get<boolean>('cacheEnabled')!;
  }

  @Query(() => [Validator])
  async getValidators(): Promise<Validator[]> {
    if (this.cacheEnabled) {
      const cachedValidators = await redisClient.get(VALIDATORS_CACHE_KEY);
      if (cachedValidators) {
        return JSON.parse(cachedValidators);
      }
    }

    const validators = await this.validatorsService.getValidators();
    return validators;
  }
}
