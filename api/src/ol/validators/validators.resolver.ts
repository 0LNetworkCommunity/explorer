import { ConfigService } from '@nestjs/config';
import { Query, Resolver } from '@nestjs/graphql';

import { ValidatorsService } from './validators.service.js';
import { Validator, ValidatorVouches, ValidatorUtils } from '../models/validator.model.js';

@Resolver(() => Validator)
export class ValidatorsResolver {
  public constructor(private readonly validatorsService: ValidatorsService) {}

  @Query(() => [Validator])
  async getValidators(): Promise<Validator[]> {
    return this.validatorsService.getValidators();
  }

  @Query(() => [ValidatorVouches])
  async getValidatorsVouches(): Promise<ValidatorVouches[]> {
    return this.validatorsService.getValidatorsVouches();
  }

  @Query(() => ValidatorUtils)
  async getValidatorUtils(): Promise<ValidatorUtils> {
    return this.validatorsService.getValidatorUtils();
  }
}
