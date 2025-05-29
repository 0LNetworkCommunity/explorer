import { Injectable } from '@nestjs/common';
import { ClickhouseService } from '../../clickhouse/clickhouse.service.js';
import { OlService } from '../../ol/ol.service.js';
import { StatsUtils } from '../utils/stats.utils.js';
import { BinRange, WalletBalance, LockedBalance, BalanceItem } from '../interfaces/stats.interface.js';

@Injectable()
export class LiquidityService {
  constructor(
    private readonly clickhouseService: ClickhouseService,
    private readonly olService: OlService,
    private readonly statsUtils: StatsUtils,
  ) {}

  async getLiquidSupplyConcentration(): Promise<BinRange[]> {
    const communityWallets = await this.olService.getCommunityWallets();
    const slowWalletsUnlockedBalances = await this.getSlowWalletsUnlockedBalances();
    const allWalletsBalances = await this.getAllWalletsBalances(
      communityWallets,
      slowWalletsUnlockedBalances,
    );
    const bins = this.binBalances(allWalletsBalances);
    return bins;
  }

  async calculateLiquidityConcentrationLocked(): Promise<any> {
    const lockedBalances = await this.getLockedBalancesForSlowWallets();
    const accountsLocked = this.calculateLockedBalancesConcentration(lockedBalances);
    const avgTotalVestingTime = this.calculateAvgTotalVestingTime(accountsLocked);
    return {
      accountsLocked,
      avgTotalVestingTime,
    };
  }

  private async getSlowWalletsUnlockedBalances(): Promise<
    { address: string; unlockedBalance: number }[]
  > {
    try {
      const query = `
      SELECT
        address,
        argMax(balance, version) AS latest_balance,
        max(version) AS latest_version
      FROM olfyi.coin_balance
      WHERE coin_module = 'libra_coin'
      GROUP BY address
    `;

      const resultSet = await this.clickhouseService.client.query({
        query: query,
        format: 'JSONEachRow',
      });

      const rows = await resultSet.json<{
        address: string;
        latest_balance: number;
        latest_version: number;
      }>();

      if (!rows.length) {
        return [];
      }

      const versions = rows.map((row) => row.latest_version);
      const chunkSize = 1000;
      const versionChunks = this.statsUtils.chunkArray<number>(versions, chunkSize);

      const allTimestampMappings = (
        await Promise.all(versionChunks.map((chunk) => this.statsUtils.mapVersionsToTimestamps(chunk)))
      ).flat();

      const versionToTimestampMap = new Map<number, number>(
        allTimestampMappings.map(({ version, timestamp }) => [version, timestamp]),
      );

      const addressBalanceMap = new Map<string, { latest_balance: number; timestamp: number }>();
      rows.forEach((row) => {
        const version = row.latest_version;
        const timestamp = versionToTimestampMap.get(version) ?? 0;
        addressBalanceMap.set(row.address, {
          latest_balance: row.latest_balance / 1e6,
          timestamp,
        });
      });

      const slowWalletQuery = `
      SELECT
        hex(SW.address) AS address,
        max(SW.unlocked) / 1e6 AS unlocked_balance
      FROM olfyi.slow_wallet SW
      GROUP BY SW.address
    `;

      const slowWalletResultSet = await this.clickhouseService.client.query({
        query: slowWalletQuery,
        format: 'JSONEachRow',
      });

      const slowWalletRows = await slowWalletResultSet.json<{
        address: string;
        unlocked_balance: number;
      }>();

      const result = slowWalletRows.map((row) => {
        const addressData = addressBalanceMap.get(row.address);
        if (addressData) {
          return {
            address: row.address,
            unlockedBalance: Math.min(row.unlocked_balance, addressData.latest_balance),
          };
        } else {
          return {
            address: row.address,
            unlockedBalance: row.unlocked_balance,
          };
        }
      });

      return result.map((row) => ({
        address: row.address,
        unlockedBalance: Math.max(0, row.unlockedBalance),
      }));
    } catch (error) {
      console.error('Error in getSlowWalletsUnlockedBalances:', error);
      throw error;
    }
  }

  private async getAllWalletsBalances(
    communityWallets: string[],
    slowWalletsUnlockedBalances: { address: string; unlockedBalance: number }[],
  ): Promise<{ address: string; balance: number }[]> {
    try {
      const communityAddresses = new Set(communityWallets.map((wallet) => wallet.toUpperCase()));
      const slowWalletsMap = new Map(
        slowWalletsUnlockedBalances.map((wallet) => [
          wallet.address.toUpperCase(),
          wallet.unlockedBalance,
        ]),
      );

      const query = `
        SELECT
          hex(address) AS address,
          argMax(balance, version) / 1e6 AS balance,
          max(version) AS latest_version
        FROM olfyi.coin_balance
        WHERE coin_module = 'libra_coin'
        GROUP BY address
      `;

      const resultSet = await this.clickhouseService.client.query({
        query: query,
        format: 'JSONEachRow',
      });

      const rows = await resultSet.json<{
        address: string;
        balance: number;
        latest_version: number;
      }>();

      if (!rows.length) {
        return [];
      }

      const addressBalanceMap = new Map<string, number>();
      rows.forEach((row) => {
        const address = row.address.toUpperCase();
        if (!communityAddresses.has(address)) {
          addressBalanceMap.set(address, row.balance);
        }
      });

      slowWalletsUnlockedBalances.forEach((row) => {
        const address = this.statsUtils.getLast15Chars(row.address);
        for (const [key, value] of addressBalanceMap.entries()) {
          if (this.statsUtils.getLast15Chars(key) === address) {
            addressBalanceMap.set(key, row.unlockedBalance);
            break;
          }
        }
      });

      const result = Array.from(addressBalanceMap.entries()).map(([address, balance]) => ({
        address,
        balance,
      }));

      return result;
    } catch (error) {
      console.error('Error in getAllWalletsBalances:', error);
      throw error;
    }
  }

  private binGenericBalances(
    balances: BalanceItem[],
    ranges: { min: number; max: number }[],
  ): BinRange[] {
    const bins: BinRange[] = ranges.map((range, index) => {
      let name = `${range.min} - ${range.max}`;
      if (index === ranges.length - 1) {
        name = `${range.min} and above`;
      }
      return { name, value: 0 };
    });

    balances.forEach((item) => {
      const binIndex = ranges.findIndex(
        (range) =>
          item.balance >= range.min && (item.balance <= range.max || range.max === Infinity),
      );
      if (binIndex !== -1) {
        bins[binIndex].value += 1;
      }
    });

    return bins;
  }

  private binBalances(allWalletsBalances: WalletBalance[]): BinRange[] {
    const balanceItems: BalanceItem[] = allWalletsBalances.map((wallet) => ({
      balance: wallet.balance,
    }));
    return this.binGenericBalances(balanceItems, [
      { min: 0, max: 250 },
      { min: 251, max: 500 },
      { min: 501, max: 2500 },
      { min: 2501, max: 5000 },
      { min: 5001, max: 25000 },
      { min: 25001, max: 50000 },
      { min: 50001, max: 250000 },
      { min: 250001, max: 500000 },
      { min: 500001, max: 2500000 },
      { min: 2500001, max: 5000000 },
      { min: 5000001, max: 25000000 },
      { min: 25000001, max: 50000000 },
      { min: 50000001, max: 100000000 },
      { min: 100000001, max: Infinity },
    ]);
  }

  private async getLockedBalancesForSlowWallets(): Promise<LockedBalance[]> {
    try {
      const slowWalletAddresses = await this.getSlowWalletAddresses();
      const walletsBalances = await this.getWalletsBalances(slowWalletAddresses);
      const unlockedBalances = await this.getSlowWalletsUnlockedBalances();

      const lockedBalances = walletsBalances
        .map((wallet) => {
          const unlockedAmount =
            unlockedBalances.find((u) => u.address === wallet.address)?.unlockedBalance || 0;
          const lockedBalanceCalculation = wallet.balance - unlockedAmount;

          return {
            address: wallet.address,
            lockedBalance: Math.max(0, lockedBalanceCalculation),
          };
        })
        .filter((wallet) => wallet.lockedBalance > 0);

      return lockedBalances;
    } catch (error) {
      console.error('Error in getLockedBalancesForSlowWallets:', error);
      throw error;
    }
  }

  private async getSlowWalletAddresses(): Promise<string[]> {
    try {
      const query = `
        SELECT DISTINCT hex(address) AS address
        FROM olfyi.slow_wallet
      `;

      const resultSet = await this.clickhouseService.client.query({
        query: query,
        format: 'JSONEachRow',
      });

      const rows = await resultSet.json<{ address: string }>();
      return rows.map((row) => row.address);
    } catch (error) {
      console.error('Error in getSlowWalletAddresses:', error);
      throw error;
    }
  }

  private async getWalletsBalances(addresses: string[]) {
    if (addresses.length === 0) {
      return [];
    }

    const query = `
      SELECT
        tupleElement("entry", 2) / 1e6 AS "balance",
        hex(tupleElement("entry", 3)) AS "address"
        FROM (
          SELECT
            arrayElement(
              arraySort(
                (x) -> tupleElement(x, 1) ,
                groupArray(
                  tuple(
                    "version",
                    "balance",
                    "address"
                  )
                )
              ),
              -1
            ) AS "entry"
          FROM olfyi."coin_balance"
          WHERE
            has(
              arrayMap(
                x -> reinterpretAsUInt256(reverse(unhex(x))),
                {addresses: Array(String)}
              ),
              "address"
            )
          AND
            "coin_module" = 'libra_coin'
          GROUP BY "address"
        )
    `;

    const resultSet = await this.clickhouseService.client.query({
      query,
      query_params: {
        addresses,
      },
      format: 'JSONEachRow',
    });
    const rows = await resultSet.json<{
      balance: number;
      address: string;
    }>();

    return rows;
  }

  private calculateLockedBalancesConcentration(lockedBalances: LockedBalance[]): BinRange[] {
    const balanceItems: BalanceItem[] = lockedBalances.map((wallet) => ({
      balance: wallet.lockedBalance,
    }));
    return this.binGenericBalances(balanceItems, [
      { min: 50001, max: 250000 },
      { min: 250001, max: 500000 },
      { min: 500001, max: 2500000 },
      { min: 2500001, max: 5000000 },
      { min: 5000001, max: 15000000 },
      { min: 1500001, max: 25000000 },
      { min: 25000001, max: 40000000 },
      { min: 40000001, max: 50000000 },
      { min: 50000001, max: 100000000 },
      { min: 100000001, max: Infinity },
    ]);
  }

  private calculateAvgTotalVestingTime(bins: BinRange[]): BinRange[] {
    return bins.map((bin) => {
      let lower, upper;
      if (bin.name.includes('and above')) {
        lower = Number(bin.name.split(' ')[0]);
        upper = lower;
      } else {
        [lower, upper] = bin.name.split(' - ').map(Number);
      }

      const middleValue = (lower + (upper || lower)) / 2;
      const vestingDays = middleValue / 35000;
      const vestingMonths = vestingDays / 30;
      return {
        name: bin.name,
        value: Math.round(vestingMonths * 100) / 100,
      };
    });
  }
}
