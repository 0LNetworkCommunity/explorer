import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { redisClient } from '../redis/redis.service.js';
import {
  ACCOUNTS_STATS_CACHE_KEY,
  STATS_CACHE_KEY,
  TOP_LIQUID_ACCOUNTS_CACHE_KEY,
} from './constants.js';
import axios from 'axios';

import {
  Stats,
  NameValue,
  SupplyStats,
  AccountsStats,
} from './types.js';
import { OlService } from '../ol/ol.service.js';
import { TopLiquidAccount } from './stats.model.js';
import { AccountsService } from './services/accounts.service.js';
import { LiquidityService } from './services/liquidity.service.js';
import { TimeSeriesService } from './services/time-series.service.js';
import { TopAccountsService } from './services/top-accounts.service.js';

@Injectable()
export class StatsService {
  private readonly dataApiHost: string;
  private readonly cacheEnabled: boolean;

  public constructor(
    private readonly olService: OlService,
    private readonly accountsService: AccountsService,
    private readonly liquidityService: LiquidityService,
    private readonly timeSeriesService: TimeSeriesService,
    private readonly topAccountsService: TopAccountsService,
    config: ConfigService,
  ) {
    this.dataApiHost = config.get('dataApiHost')!;
    this.cacheEnabled = config.get<boolean>('cacheEnabled')!;
  }

  private async setCache<T>(key: string, data: T): Promise<void> {
    try {
      await redisClient.set(key, JSON.stringify(data));
    } catch (error) {
      console.error(`Error setting data to cache for key ${key}:`, error);
    }
  }

  public async getCirculatingSupply(): Promise<number> {
    const supplyStats = await this.olService.getSupplyStats();
    return Number(supplyStats.circulatingSupply.toFixed(3));
  }

  public async getTotalSupply(): Promise<number> {
    const supplyStats = await this.olService.getSupplyStats();
    return Number(supplyStats.totalSupply.toFixed(3));
  }

  public async getStats(): Promise<Stats> {
    const supplyStats = await this.olService.getSupplyStats();
    const totalSupply: number = supplyStats.totalSupply;

    // Use specialized services
    const slowWalletsCountOverTime = await this.timeSeriesService.getSlowWalletsCountOverTime();
    const burnOverTime = await this.timeSeriesService.getBurnsOverTime();
    const accountsOnChainOverTime = await this.accountsService.getAccountsOnChainOverTime();
    const supplyAndCapital = await this.getSupplyAndCapital(supplyStats);
    const communityWalletsBalanceBreakdown = await this.timeSeriesService.getCommunityWalletsBalanceBreakdown();
    const lastEpochTotalUnlockedAmount = await this.timeSeriesService.getLastEpochTotalUnlockedAmount();
    const pofValues = await this.timeSeriesService.getPOFValues();
    const liquidSupplyConcentration = await this.liquidityService.getLiquidSupplyConcentration();
    const lockedSupplyConcentration = await this.liquidityService.calculateLiquidityConcentrationLocked();

    // calculate KPIS
    const circulatingSupply = {
      nominal: parseFloat(supplyStats.circulatingSupply.toFixed(3)),
      percentage: parseFloat(((supplyStats.circulatingSupply / totalSupply) * 100).toFixed(3)),
    };

    const communityWalletsBalance = {
      nominal: parseFloat(supplyStats.cwSupply.toFixed(3)),
      percentage: parseFloat(((supplyStats.cwSupply / totalSupply) * 100).toFixed(3)),
    };

    const currentLockedOnSlowWallets = {
      nominal: parseFloat(supplyStats.slowLockedSupply.toFixed(3)),
      percentage: parseFloat(((supplyStats.slowLockedSupply / totalSupply) * 100).toFixed(3)),
    };

    const infrastructureEscrow = {
      nominal: parseFloat(supplyStats.infraEscrowSupply.toFixed(3)),
      percentage: parseFloat(((supplyStats.infraEscrowSupply / totalSupply) * 100).toFixed(3)),
    };

    const totalBurned = {
      nominal: 100_000_000_000 - totalSupply,
      percentage: ((100_000_000_000 - totalSupply) / 100_000_000_000) * 100,
    };

    const lastEpochReward = {
      nominal: pofValues.nominalRewardOverTime[pofValues.nominalRewardOverTime.length - 1].value,
      percentage:
        (pofValues.nominalRewardOverTime[pofValues.nominalRewardOverTime.length - 1].value /
          totalSupply) *
        100,
    };

    const response = await axios.get(`${this.dataApiHost}/locked-coins`);
    const lockedCoins = response.data;

    const res: Stats = {
      // charts
      slowWalletsCountOverTime,
      burnOverTime,
      accountsOnChainOverTime,
      supplyAllocation: supplyAndCapital.supplyAllocation,
      individualsCapital: supplyAndCapital.individualsCapital,
      communityCapital: supplyAndCapital.communityCapital,
      communityWalletsBalanceBreakdown: communityWalletsBalanceBreakdown,
      rewardsOverTime: pofValues.nominalRewardOverTime,
      clearingBidoverTime: pofValues.clearingBidOverTime,
      liquidSupplyConcentration: liquidSupplyConcentration,
      lockedSupplyConcentration: lockedSupplyConcentration,

      // kpis
      circulatingSupply,
      totalBurned,
      communityWalletsBalance,
      currentSlowWalletsCount: slowWalletsCountOverTime[slowWalletsCountOverTime.length - 1].value,
      currentLockedOnSlowWallets,
      lastEpochTotalUnlockedAmount: {
        nominal: lastEpochTotalUnlockedAmount,
        percentage: (lastEpochTotalUnlockedAmount / totalSupply) * 100,
      },
      lastEpochReward,
      currentClearingBid:
        pofValues.clearingBidOverTime[pofValues.clearingBidOverTime.length - 1].value / 10,
      infrastructureEscrow,
      lockedCoins,
    };
    return res;
  }

  public async getAccountsStats(): Promise<AccountsStats> {
    return this.accountsService.getAccountsStats();
  }

  public async getTopUnlockedBalanceWallets(): Promise<TopLiquidAccount[]> {
    const circulatingSupply = await this.getCirculatingSupply();
    return this.topAccountsService.getTopUnlockedBalanceWallets(circulatingSupply);
  }

  private async getSupplyAndCapital(supplyStats: SupplyStats): Promise<{
    supplyAllocation: NameValue[];
    individualsCapital: NameValue[];
    communityCapital: NameValue[];
  }> {
    const totalSupply = supplyStats.totalSupply;
    const circulating = supplyStats.circulatingSupply;
    const communityWalletsBalances = supplyStats.cwSupply;
    const infraEscrowBalance = supplyStats.infraEscrowSupply;
    const slowLocked = supplyStats.slowLockedSupply;

    try {
      const supplyAllocation = [
        { name: 'Community Wallets', value: communityWalletsBalances },
        { name: 'Locked', value: slowLocked },
        { name: 'Infrastructure escrow', value: infraEscrowBalance },
        { name: 'Circulating', value: circulating },
      ];

      const individualsCapital = [
        { name: 'Locked', value: slowLocked },
        { name: 'Circulating', value: circulating },
      ];

      const communityCapital = [
        { name: 'Community Wallets', value: communityWalletsBalances },
        { name: 'Infrastructure escrow', value: infraEscrowBalance },
      ];

      return {
        supplyAllocation,
        individualsCapital,
        communityCapital,
      };
    } catch (error) {
      console.error('Error in getSupplyAndCapital:', error);
      throw error;
    }
  }

  public async updateCache(): Promise<void> {
    const stats = await this.getStats();
    this.setCache(STATS_CACHE_KEY, JSON.stringify(stats));

    const accountsStats = await this.getAccountsStats();
    this.setCache(ACCOUNTS_STATS_CACHE_KEY, JSON.stringify(accountsStats));

    const circulatingSupply = await this.getCirculatingSupply();
    const topLiquidAccounts = await this.topAccountsService.getTopUnlockedBalanceWallets(circulatingSupply);
    this.setCache(TOP_LIQUID_ACCOUNTS_CACHE_KEY, topLiquidAccounts);
  }
}

