import { Query, Resolver } from '@nestjs/graphql';
import { Inject } from '@nestjs/common';
import {
  CommunityWallet,
  CommunityWalletStats,
  CommunityWalletDetails,
  CommunityWalletPayments,
} from './community-wallet.model.js';
import { ICommunityWalletsService } from './interfaces.js';
import { Types } from '../../types.js';

@Resolver()
export class CommunityWalletsResolver {
  public constructor(
    @Inject(Types.ICommunityWalletsService)
    private readonly communityWalletsService: ICommunityWalletsService,
  ) {}

  @Query(() => [CommunityWallet])
  async getCommunityWallets(): Promise<CommunityWallet[]> {
    return this.communityWalletsService.getCommunityWallets();
  }

  @Query(() => CommunityWalletStats)
  async getCommunityWalletsStats(): Promise<CommunityWalletStats> {
    return this.communityWalletsService.getCommunityWalletsStats();
  }

  @Query(() => [CommunityWalletPayments])
  async getCommunityWalletsPayments(): Promise<CommunityWalletPayments[]> {
    return this.communityWalletsService.getCommunityWalletsPayments();
  }

  @Query(() => [CommunityWalletDetails])
  async getCommunityWalletsDetails(): Promise<CommunityWalletDetails[]> {
    return this.communityWalletsService.getCommunityWalletsDetails();
  }
}
