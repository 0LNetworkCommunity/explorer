import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { ClickhouseService } from '../../clickhouse/clickhouse.service.js';
import { StatsUtils } from '../utils/stats.utils.js';
import { TopLiquidAccount } from '../stats.model.js';
import { WellKnownAddress } from '../interfaces/stats.interface.js';
import { ICommunityWalletsService } from '../../ol/community-wallets/interfaces.js';
import { Types } from '../../types.js';
import { OlConfig } from '../../config/config.interface.js';
import { redisClient } from '../../redis/redis.service.js';
import { TOP_LIQUID_ACCOUNTS_CACHE_KEY } from '../constants.js';

@Injectable()
export class TopAccountsService {
  private readonly cacheEnabled: boolean;
  private readonly knownAddressesUrl?: string | undefined;

  constructor(
    private readonly clickhouseService: ClickhouseService,
    private readonly statsUtils: StatsUtils,
    @Inject(Types.ICommunityWalletsService)
    private readonly communityWalletsService: ICommunityWalletsService,
    config: ConfigService,
  ) {
    this.cacheEnabled = config.get<boolean>('cacheEnabled')!;
    this.knownAddressesUrl = config.get<OlConfig>('ol')?.knwonAddressesUrl;
  }

  async getTopUnlockedBalanceWallets(circulatingSupply: number): Promise<TopLiquidAccount[]> {
    if (this.cacheEnabled) {
      const cachedStats = await redisClient.get(TOP_LIQUID_ACCOUNTS_CACHE_KEY);
      if (cachedStats) {
        return JSON.parse(cachedStats);
      }
    }

    const topLiquidAccounts = await this.queryTopLiquidAccounts(circulatingSupply);
    if (this.cacheEnabled) {
      await this.setCache(TOP_LIQUID_ACCOUNTS_CACHE_KEY, topLiquidAccounts);
    }

    return topLiquidAccounts;
  }

  private async queryTopLiquidAccounts(circulatingSupply: number): Promise<TopLiquidAccount[]> {
    const limit = 100;

    try {
      const knownAddresses = await this.loadKnownAddresses();
      const communityWallets = await this.communityWalletsService.getCommunityWallets();
      const communityAddresses = new Set(communityWallets.map((wallet) => wallet.address));

      const coinBalanceQuery = `
        SELECT
          address,
          argMax(balance, version) AS latest_balance
        FROM olfyi.coin_balance
        WHERE coin_module = 'libra_coin'
        GROUP BY address
      `;

      const coinBalanceResultSet = await this.clickhouseService.client.query({
        query: coinBalanceQuery,
        format: 'JSONEachRow',
      });

      const coinBalanceRows: Array<{
        address: string;
        latest_balance: number;
      }> = await coinBalanceResultSet.json();

      if (!coinBalanceRows.length) {
        return [];
      }

      const addressBalanceMap = new Map<string, number>();
      coinBalanceRows.forEach((row) => {
        const address = this.statsUtils.toHexString(row.address).toUpperCase();
        if (!communityAddresses.has(address)) {
          addressBalanceMap.set(address, row.latest_balance / 1e6);
        }
      });

      const slowWalletQuery = `
        SELECT
          hex(address) AS address,
          argMax(unlocked, version) / 1e6 AS unlocked_balance
        FROM olfyi.slow_wallet
        GROUP BY address
      `;

      const slowWalletResultSet = await this.clickhouseService.client.query({
        query: slowWalletQuery,
        format: 'JSONEachRow',
      });

      const slowWalletRows: Array<{
        address: string;
        unlocked_balance: number;
      }> = await slowWalletResultSet.json();

      slowWalletRows.forEach((row) => {
        const address = this.statsUtils.getLast15Chars(row.address);
        for (const [key, value] of addressBalanceMap.entries()) {
          if (this.statsUtils.getLast15Chars(key) === address) {
            addressBalanceMap.set(key, row.unlocked_balance);
            break;
          }
        }
      });

      const result = Array.from(addressBalanceMap.entries()).map(([address, unlockedBalance]) => ({
        address,
        unlockedBalance,
        percentOfCirculating: (unlockedBalance / circulatingSupply) * 100,
      }));

      result.sort((a, b) => b.unlockedBalance - a.unlockedBalance);
      let ret = result.slice(0, limit).map(
        (item, index) =>
          new TopLiquidAccount({
            rank: index + 1,
            address: item.address,
            name: knownAddresses.get(item.address)?.name,
            unlocked: item.unlockedBalance,
            balance: item.unlockedBalance,
            liquidShare: item.percentOfCirculating,
          }),
      );
      return ret;
    } catch (error) {
      console.error('Error in getTopUnlockedBalanceWallets:', error);
      throw error;
    }
  }

  async loadKnownAddresses(): Promise<Map<string, WellKnownAddress>> {
    const wka = new Map<string, WellKnownAddress>();
    if (!this.knownAddressesUrl) {
      return wka;
    }
    try {
      const response = await axios.get(this.knownAddressesUrl);
      const data = response.data;
      Object.keys(data.wellKnownAddresses).forEach((address) => {
        let addressStr = address.replace(/^0x/, '').toUpperCase();
        wka.set(addressStr, data.wellKnownAddresses[address] as WellKnownAddress);
      });
    } catch (error) {
      console.error('Error loading validator handles from URL:', error);
      return new Map<string, WellKnownAddress>();
    }
    return wka;
  }

  private async setCache<T>(key: string, data: T): Promise<void> {
    try {
      await redisClient.set(key, JSON.stringify(data));
    } catch (error) {
      console.error(`Error setting data to cache for key ${key}:`, error);
    }
  }
}
