// src/validators/validators.resolver.ts
import { Query, Resolver } from "@nestjs/graphql";
import { ServiceUnavailableException } from "@nestjs/common";
import { ValidatorsService } from "./validators.service.js";
import { Validator } from "../models/validator.model.js";
import { redisClient } from "../../redis/redis.service.js";
import { VALIDATORS_CACHE_KEY } from "../constants.js";

@Resolver(() => Validator)
export class ValidatorsResolver {
  private cacheEnabled = true; // Set to true if cache is enabled

  public constructor(private readonly validatorsService: ValidatorsService) {}

  @Query(() => [Validator])
  async getValidators(): Promise<Validator[]> {
    if (this.cacheEnabled) {
      const cachedValidators = await redisClient.get(VALIDATORS_CACHE_KEY);
      if (cachedValidators) {
        return JSON.parse(cachedValidators);
      }
      // throw new ServiceUnavailableException("Cache not ready");
    }

    const validators = await this.validatorsService.getValidators();
    return validators;
  }
}
