import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ClickhouseService } from '../../clickhouse/clickhouse.service.js';
import { StatsUtils } from '../utils/stats.utils.js';
import { TimestampValue, NameValue } from '../interfaces/stats.interface.js';

@Injectable()
export class TimeSeriesService {
  private readonly dataApiHost: string;

  constructor(
    private readonly clickhouseService: ClickhouseService,
    private readonly statsUtils: StatsUtils,
    config: ConfigService,
  ) {
    this.dataApiHost = config.get('dataApiHost')!;
  }

  async getSlowWalletsCountOverTime(): Promise<TimestampValue[]> {
    try {
      const resultSet = await this.clickhouseService.client.query({
        query: `
              SELECT
                "version",
                "list_count" AS "value"
              FROM olfyi."slow_wallet_list"
              ORDER BY "version" ASC
            `,
        format: 'JSONEachRow',
      });
      const rows = await resultSet.json<{
        version: string;
        value: string;
      }>();

      if (!rows.length) {
        console.warn('No data found for slow wallets over time.');
        return [];
      }

      // Extract versions and convert them to timestamps
      const versions = rows.map((row) => parseInt(row.version, 10));
      const timestampsMap = await this.statsUtils.mapVersionsToTimestamps(versions);

      const slowWalletsOverTime = rows.map((row) => {
        const version = parseInt(row.version, 10);
        const timestampEntry = timestampsMap.find((entry) => entry.version === version);
        const timestamp = timestampEntry ? timestampEntry.timestamp : 0;

        return {
          timestamp,
          value: parseInt(row.value, 10),
        };
      });

      const baseTimestamp = new Date('2023-11-28T00:00:00Z').getTime() / 1000;
      if (slowWalletsOverTime[0].timestamp == 0) {
        slowWalletsOverTime[0].timestamp = baseTimestamp;
      }

      const result = slowWalletsOverTime.map((item) => ({
        timestamp: Math.round(item.timestamp),
        value: item.value,
      }));

      return result;
    } catch (error) {
      console.error('Error in getSlowWalletsCountOverTime:', error);
      throw error;
    }
  }

  async getBurnsOverTime(): Promise<TimestampValue[]> {
    try {
      const query = `
        SELECT
          "version",
          divide("lifetime_burned", 1000000) AS "value"
        FROM olfyi."burn_counter"
        ORDER BY "version" ASC
      `;

      const resultSet = await this.clickhouseService.client.query({
        query: query,
        format: 'JSONEachRow',
      });

      const rows = await resultSet.json<{
        version: string;
        value: number;
      }>();

      if (!rows.length) {
        return [];
      }

      // Extract versions and convert them to timestamps
      const versions = rows.map((row) => parseInt(row.version, 10));
      const timestampsMap = await this.statsUtils.mapVersionsToTimestamps(versions);

      const burnsOverTime = rows.map((row) => {
        const version = parseInt(row.version, 10);
        const timestampEntry = timestampsMap.find((entry) => entry.version === version);
        const timestamp = timestampEntry ? timestampEntry.timestamp : 0;

        return {
          timestamp,
          value: row.value,
        };
      });

      const baseTimestamp = new Date('2023-11-28T00:00:00Z').getTime() / 1000;
      if (burnsOverTime[0].timestamp == 0) {
        burnsOverTime[0].timestamp = baseTimestamp;
      }

      return burnsOverTime.map((item) => ({
        timestamp: Math.round(item.timestamp),
        value: item.value,
      }));
    } catch (error) {
      console.error('Error in getBurnsOverTime:', error);
      throw error;
    }
  }

  async getPOFValues(): Promise<{
    clearingBidOverTime: Array<TimestampValue>;
    nominalRewardOverTime: Array<TimestampValue>;
    netRewardOverTime: Array<TimestampValue>;
  }> {
    try {
      const query = `
        SELECT
          version,
          nominal_reward / 1e6 AS nominalReward,
          net_reward / 1e6 AS netReward,
          clearing_bid AS clearingBid
        FROM olfyi.consensus_reward
        ORDER BY version ASC
      `;

      const resultSet = await this.clickhouseService.client.query({
        query: query,
        format: 'JSONEachRow',
      });

      const rows = await resultSet.json<{
        version: string;
        nominalReward: string;
        netReward: string;
        clearingBid: string;
      }>();

      if (!rows.length) {
        return {
          clearingBidOverTime: [],
          nominalRewardOverTime: [],
          netRewardOverTime: [],
        };
      }

      // Clean and parse the rows
      const cleanedRows = rows.map((row) => ({
        version: parseInt(String(row.version).replace('\n', ''), 10),
        nominalReward: parseFloat(String(row.nominalReward).replace('\n', '')),
        netReward: parseFloat(String(row.netReward).replace('\n', '')),
        clearingBid: parseFloat(String(row.clearingBid).replace('\n', '')),
      }));

      const versions = cleanedRows.map((row) => row.version);
      const chunkSize = 1000;
      const versionChunks = this.statsUtils.chunkArray<number>(versions, chunkSize);

      const allTimestampMappings: { version: number; timestamp: number }[] = [];

      for (const chunk of versionChunks) {
        const timestampsMap = await this.statsUtils.mapVersionsToTimestamps(chunk);
        allTimestampMappings.push(...timestampsMap);
      }

      // Helper to convert version to timestamp
      const convertVersionToTimestamp = (version: number) => {
        const timestampEntry = allTimestampMappings.find((entry) => entry.version === version);
        return timestampEntry ? Math.floor(timestampEntry.timestamp) : 0;
      };

      // Transform the data into the desired format and adjust timestamps
      const clearingBidOverTime = cleanedRows.map((row) => ({
        timestamp: convertVersionToTimestamp(row.version),
        value: row.clearingBid,
      }));

      const nominalRewardOverTime = cleanedRows.map((row) => ({
        timestamp: convertVersionToTimestamp(row.version),
        value: row.nominalReward,
      }));

      const netRewardOverTime = cleanedRows.map((row) => ({
        timestamp: convertVersionToTimestamp(row.version),
        value: row.netReward,
      }));

      return {
        clearingBidOverTime,
        nominalRewardOverTime,
        netRewardOverTime,
      };
    } catch (error) {
      console.error('Error in getPOFValues:', error);
      throw error;
    }
  }

  async getCommunityWalletsBalanceBreakdown(): Promise<NameValue[]> {
    const addressNames = [
      {
        address: 'FBE8DA53C92CEEEB40D8967EC033A0FB',
        name: 'Community development',
      },
      {
        address: '2640CD6D652AC94DC5F0963DCC00BCC7',
        name: 'Engineering Fund, tool-scrubbers-guild',
      },
      {
        address: 'C906F67F626683B77145D1F20C1A753B',
        name: 'The Iqlusion Engineering Program',
      },
      {
        address: '3A6C51A0B786D644590E8A21591FA8E2',
        name: 'FTW: Ongoing Full-Time Workers Program',
      },
      { address: 'BCA50D10041FA111D1B44181A264A599', name: 'A Good List' },
      { address: '2B0E8325DEA5BE93D856CFDE2D0CBA12', name: 'Tip Jar' },
      {
        address: '19E966BFA4B32CE9B7E23721B37B96D2',
        name: 'Social Infrastructure Program',
      },
      {
        address: 'B31BD7796BC113013A2BF6C3953305FD',
        name: 'Danish Red Cross Humanitarian Fund',
      },
      {
        address: 'BC25F79FEF8A981BE4636AC1A2D6F587',
        name: 'Application Studio',
      },
      { address: '2057BCFB0189B7FD0ABA7244BA271661', name: 'Moonshot Program' },
      {
        address: 'F605FE7F787551EEA808EE9ACDB98897',
        name: 'Human Rewards Program',
      },
      {
        address: 'C19C06A592911ED31C4100E9FB63AD7B',
        name: 'RxC Research and Experimentation',
      },
      {
        address: '1367B68C86CB27FA7215D9F75A26EB8F',
        name: 'University of Toronto MSRG',
      },
      {
        address: 'BB6926434D1497A559E4F0487F79434F',
        name: 'Deep Technology Innovation Program',
      },
      {
        address: '87DC2E497AC6EDAB21511333A421E5A5',
        name: 'Working Group Key Roles',
      },
    ];

    const addresses = addressNames.map((entry) => entry.address);
    const balances = await this.getWalletsBalances(addresses);

    const balanceBreakdown = addressNames.map(({ name, address }) => {
      const balanceEntry = balances.find((entry) => entry.address === address);
      return {
        name,
        value: balanceEntry ? balanceEntry.balance : 0,
      };
    });

    return balanceBreakdown;
  }

  async getLastEpochTotalUnlockedAmount(): Promise<number> {
    try {
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

      if (!slowWalletRows.length) {
        return 0;
      }

      // Collect addresses from slow wallet rows
      const addresses = slowWalletRows.map((row) => row.address);

      // Batch process addresses to get their latest balances
      const addressChunks = this.statsUtils.chunkArray<string>(addresses, 1000); // Adjust chunk size as necessary
      const balanceResults: { address: string; latest_balance: number }[] = [];

      for (const chunk of addressChunks) {
        const formattedAddresses = chunk.map((addr) => `'${addr}'`).join(',');
        const balanceQuery = `
          SELECT
            hex(address) AS address,
            argMax(balance, version) / 1e6 AS latest_balance
          FROM olfyi.coin_balance
          WHERE coin_module = 'libra_coin' AND address IN (${formattedAddresses})
          GROUP BY address
        `;

        const balanceResultSet = await this.clickhouseService.client.query({
          query: balanceQuery,
          format: 'JSONEachRow',
        });

        const balanceRows = await balanceResultSet.json<{
          address: string;
          latest_balance: number;
        }>();
        balanceResults.push(...balanceRows);
      }

      // Create a map of address to latest balance
      const balanceMap = new Map(balanceResults.map((row) => [row.address, row.latest_balance]));

      // Combine data from both queries
      const lockedBalances = slowWalletRows.map((row) => {
        const latest_balance = balanceMap.get(row.address) ?? 0;
        const unlocked_balance = row.unlocked_balance;
        const locked_balance = latest_balance - unlocked_balance;
        return {
          address: row.address,
          locked_balance,
        };
      });

      // Count the wallets with locked balance greater than 35000
      const count = lockedBalances.reduce(
        (acc, row) => acc + (row.locked_balance > 35000 ? 1 : 0),
        0,
      );

      // Calculate the total amount based on the counter
      const totalUnlockedAmount = count * 35000;
      return totalUnlockedAmount;
    } catch (error) {
      console.error('Error in getLastEpochTotalUnlockedAmount:', error);
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
}
