import { Injectable } from '@nestjs/common';
import { ClickhouseService } from '../../clickhouse/clickhouse.service.js';
import { StatsUtils } from '../utils/stats.utils.js';
import { TimestampValue, AccountsStats } from '../interfaces/stats.interface.js';

@Injectable()
export class AccountsService {
  constructor(
    private readonly clickhouseService: ClickhouseService,
    private readonly statsUtils: StatsUtils,
  ) {}

  async getAccountsOnChainOverTime(): Promise<TimestampValue[]> {
    try {
      const query = `
        SELECT
          version,
          address
        FROM coin_balance
        WHERE coin_module = 'libra_coin'
        ORDER BY version ASC
      `;

      const resultSet = await this.clickhouseService.client.query({
        query: query,
        format: 'JSONEachRow',
      });

      const rows = await resultSet.json<{
        version: string;
        address: string;
      }>();

      if (!rows.length) {
        return [];
      }

      // Extract versions and convert them to timestamps
      const versions = rows.map((row) => parseInt(row.version, 10));
      const chunkSize = 1000;
      const versionChunks = this.statsUtils.chunkArray<number>(versions, chunkSize);

      const allTimestampMappings = (
        await Promise.all(versionChunks.map((chunk) => this.statsUtils.mapVersionsToTimestamps(chunk)))
      ).flat();

      const versionToTimestampMap = new Map<number, number>(
        allTimestampMappings.map(({ version, timestamp }) => [version, timestamp]),
      );

      const accountsOverTime: TimestampValue[] = [];
      const seenAddresses = new Set<string>();
      const dailyCounts = new Map<number, number>();

      rows.forEach((row) => {
        const version = parseInt(row.version, 10);
        const timestamp = versionToTimestampMap.get(version) ?? 0;
        const dayTimestamp = Math.floor(timestamp / 86400) * 86400;

        if (!seenAddresses.has(row.address)) {
          seenAddresses.add(row.address);
          const currentCount = dailyCounts.get(dayTimestamp) || 0;
          dailyCounts.set(dayTimestamp, currentCount + 1);
        }
      });

      // Convert daily counts to the desired format
      dailyCounts.forEach((count, timestamp) => {
        accountsOverTime.push({
          timestamp: timestamp,
          value: count,
        });
      });

      // Ensure the array is sorted by timestamp
      accountsOverTime.sort((a, b) => a.timestamp - b.timestamp);

      // Accumulate counts over time
      let runningTotal = 0;
      accountsOverTime.forEach((entry) => {
        runningTotal += entry.value;
        entry.value = runningTotal;
      });

      return accountsOverTime;
    } catch (error) {
      console.error('Error in getAccountsOnChainOverTime:', error);
      throw error;
    }
  }

  async getAccountsStats(): Promise<AccountsStats> {
    const totalAccounts = await this.getTotalUniqueAccounts();
    const activeAddressesCount = await this.getActiveAddressesCount();
    return { totalAccounts, activeAddressesCount };
  }

  async getActiveAddressesCount(): Promise<{
    lastDay: number;
    last30Days: number;
    last90Days: number;
  }> {
    try {
      const query = `
        SELECT
          version,
          address
        FROM olfyi.coin_balance
        WHERE coin_module = 'libra_coin'
        ORDER BY version ASC
      `;

      const resultSet = await this.clickhouseService.client.query({
        query: query,
        format: 'JSONEachRow',
      });

      const rows = await resultSet.json<{
        version: string;
        address: string;
      }>();

      if (!rows.length) {
        return {
          lastDay: 0,
          last30Days: 0,
          last90Days: 0,
        };
      }

      // Extract versions and convert them to timestamps
      const versions = rows.map((row) => parseInt(row.version, 10));
      const chunkSize = 1000;
      const versionChunks = this.statsUtils.chunkArray<number>(versions, chunkSize);
      const allTimestampMappings = (
        await Promise.all(versionChunks.map((chunk) => this.statsUtils.mapVersionsToTimestamps(chunk)))
      ).flat();

      const versionToTimestampMap = new Map<number, number>(
        allTimestampMappings.map(({ version, timestamp }) => [version, timestamp]),
      );

      const now = Math.floor(Date.now() / 1000);
      const oneDayAgo = now - 86400;
      const thirtyDaysAgo = now - 30 * 86400;
      const ninetyDaysAgo = now - 90 * 86400;

      const seenAddressesLastDay = new Set<string>();
      const seenAddressesLast30Days = new Set<string>();
      const seenAddressesLast90Days = new Set<string>();

      rows.forEach((row) => {
        const version = parseInt(row.version, 10);
        const timestamp = versionToTimestampMap.get(version) ?? 0;

        if (timestamp >= oneDayAgo) {
          seenAddressesLastDay.add(row.address);
        }
        if (timestamp >= thirtyDaysAgo) {
          seenAddressesLast30Days.add(row.address);
        }
        if (timestamp >= ninetyDaysAgo) {
          seenAddressesLast90Days.add(row.address);
        }
      });

      return {
        lastDay: seenAddressesLastDay.size,
        last30Days: seenAddressesLast30Days.size,
        last90Days: seenAddressesLast90Days.size,
      };
    } catch (error) {
      console.error('Error in getActiveAddressesCount:', error);
      throw error;
    }
  }

  async getTotalUniqueAccounts(): Promise<number> {
    try {
      const query = `
        SELECT COUNT(DISTINCT address) AS unique_accounts
        FROM olfyi.coin_balance
        WHERE coin_module = 'libra_coin'
      `;

      const resultSet = await this.clickhouseService.client.query({
        query: query,
        format: 'JSONEachRow',
      });

      const rows = await resultSet.json<{ unique_accounts: number }[]>();

      if (rows.length === 0) {
        return 0;
      }
      const uniqueAccountsCount = Number(rows[0]['unique_accounts']);

      return uniqueAccountsCount;
    } catch (error) {
      console.error('Error in getTotalUniqueAccounts:', error);
      throw error;
    }
  }
}
