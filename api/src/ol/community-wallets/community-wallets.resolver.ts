import { Query, Resolver } from '@nestjs/graphql';
import _ from 'lodash';
import { Inject } from '@nestjs/common';
import { redisClient } from '../../redis/redis.service.js';
import { GqlCommunityWallet } from './community-wallet.model.js';
import { ICommunityWalletsService } from './interfaces.js';
import { Types } from '../../types.js';
import { ServiceUnavailableException } from '@nestjs/common';
import { COMMUNITY_WALLETS_CACHE_KEY } from '../constants.js';

@Resolver()
export class CommunityWalletsResolver {
  private readonly cacheEnabled: boolean;

  public constructor(
    @Inject(Types.ICommunityWalletsService)
    private readonly communityWalletsService: ICommunityWalletsService,
  ) {
    this.cacheEnabled = process.env.CACHE_ENABLED === 'true'; // Check if cache is enabled
  }

  @Query(() => [GqlCommunityWallet])
  async getCommunityWallets(): Promise<GqlCommunityWallet[]> {
    // Check if cache is enabled
    if (this.cacheEnabled) {
      const cachedWallets = await redisClient.get(COMMUNITY_WALLETS_CACHE_KEY);
      if (cachedWallets) {
        return JSON.parse(cachedWallets);
      }
      throw new ServiceUnavailableException('Cache not ready');
    }

    // If cache is not enabled, fetch data from service
    return this.communityWalletsService.getCommunityWallets();
  }
}
