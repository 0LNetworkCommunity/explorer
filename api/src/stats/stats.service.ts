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
import { StatsUtils } from './utils/stats.utils.js';

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
    private readonly statsUtils: StatsUtils,
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

    const unlockedSupply = {
      nominal: parseFloat(supplyStats.unlockedSupply.toFixed(3)),
      percentage: parseFloat(((supplyStats.unlockedSupply / totalSupply) * 100).toFixed(3)),
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

    // Get the locked coins data
    const response = await axios.get(`${this.dataApiHost}/locked-coins`);
    const rawLockedCoins = response.data;

    // Filter the data early to reduce processing load for subsequent operations
    // This is more efficient as we now process fewer points through the timestamp mapping
    const filteredLockedCoins = this.filterUniqueLockValues(rawLockedCoins);

    // The data format is [[version, amount], [version, amount], ...]
    // Extract versions from the filtered data - first element of each array
    const versions = filteredLockedCoins.map((item: [number, number]) => item[0]);

    // Process versions in smaller batches to avoid "Field value too long" error
    const MAX_BATCH_SIZE = 100;
    const allTimestampMappings: Array<{ version: number, timestamp: number }> = [];

    // Process versions in chunks
    try {
      for (let i = 0; i < versions.length; i += MAX_BATCH_SIZE) {
        try {
          const versionsBatch = versions.slice(i, i + MAX_BATCH_SIZE);
          const timestampsMappingBatch = await this.statsUtils.mapVersionsToTimestamps(versionsBatch);
          allTimestampMappings.push(...timestampsMappingBatch);
        } catch (error) {
          console.error(`Error processing batch ${Math.floor(i / MAX_BATCH_SIZE) + 1}:`, error);
        }
      }
    } catch (error) {
      console.error('Error in version to timestamp mapping process:', error);
    }

    // Create a map for quick lookup of version to timestamp
    const versionToTimestampMap = new Map(
      allTimestampMappings.map(({ version, timestamp }) => [version, timestamp])
    );

    // Transform the filtered locked coins data using the timestamp map
    const timestampedCoins: [number, number][] = filteredLockedCoins.map((item: [number, number]) => {
      const [version, amount] = item;
      const timestamp = versionToTimestampMap.get(version) || 0;
      return [timestamp, amount];
    });

    // Further filter to only include one entry per day
    const lockedCoins = this.filterUniqueDays(timestampedCoins);

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
      unlockedSupply,
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

  /**
   * Filters an array of [version, value] pairs to only include points where the value changes
   * This reduces the number of data points while preserving the chart appearance
   */
  private filterUniqueLockValues(data: [number, number][]): [number, number][] {
    if (data.length <= 2) return data; // No filtering needed for very small datasets

    const result: [number, number][] = [];

    // Always include the first point
    if (data.length > 0) {
      result.push(data[0]);
    }

    let lastValue = data[0]?.[1];

    // Only include points where the value changes
    for (let i = 1; i < data.length - 1; i++) {
      const currentValue = data[i][1];

      if (currentValue !== lastValue) {
        // Value changed, include this point
        result.push(data[i]);
        lastValue = currentValue;
      }
    }

    // Always include the last point
    if (data.length > 1) {
      result.push(data[data.length - 1]);
    }

    return result;
  }

  /**
   * Filters an array of [timestamp, value] pairs to only include one entry per day
   * Takes the first occurrence of each day
   */
  private filterUniqueDays(data: [number, number][]): [number, number][] {
    if (data.length <= 1) return data;

    const result: [number, number][] = [];
    const seenDays = new Set<string>();

    // Sort by timestamp to ensure chronological order
    const sortedData = [...data].sort((a, b) => a[0] - b[0]);

    for (const [timestamp, value] of sortedData) {
      // Skip entries with invalid timestamps
      if (timestamp <= 0) continue;

      // Convert timestamp to date string (YYYY-MM-DD)
      const date = new Date(timestamp * 1000);
      const dateString = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;

      // Only add the first occurrence of each day
      if (!seenDays.has(dateString)) {
        seenDays.add(dateString);
        result.push([timestamp, value]);
      }
    }

    return result;
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
    const unlocked = supplyStats.unlockedSupply;
    const circulating = supplyStats.circulatingSupply;

    const communityWalletsBalances = supplyStats.cwSupply;
    const infraEscrowBalance = supplyStats.infraEscrowSupply;
    const slowLocked = supplyStats.slowLockedSupply;
    const cwCredit = circulating - unlocked;

    try {
      const supplyAllocation = [
        { name: 'Community Wallets net of credit', value: communityWalletsBalances - cwCredit },
        { name: 'Locked', value: slowLocked },
        { name: 'Infrastructure escrow', value: infraEscrowBalance },
        { name: 'Unlocked', value: unlocked },
        { name: 'CW credit', value: cwCredit },
      ];

      const individualsCapital = [
        { name: 'Locked', value: slowLocked },
        { name: 'Unlocked', value: unlocked },
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
