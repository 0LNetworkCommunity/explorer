import { Inject, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import axios from "axios";

import {
  Stats,
  TimestampValue,
  NameValue,
  WalletBalance,
  LockedBalance,
  BinRange,
  BalanceItem,
  SupplyStats,
} from "./types.js";
import { ClickhouseService } from "../clickhouse/clickhouse.service.js";
import { OlService } from "../ol/ol.service.js";
import { ICommunityWalletsService } from "../ol/community-wallets/interfaces.js";
import { Types } from "../types.js";
import _ from "lodash";

@Injectable()
export class StatsService {
  private readonly dataApiHost: string;

  public constructor(
    private readonly clickhouseService: ClickhouseService,
    private readonly olService: OlService,

    @Inject(Types.ICommunityWalletsService)
    private readonly communityWalletsService: ICommunityWalletsService,

    config: ConfigService,
  ) {
    this.dataApiHost = config.get("dataApiHost")!;
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
    console.time("getSupplyStats");
    const supplyStats = await this.olService.getSupplyStats();
    console.timeEnd("getSupplyStats");

    console.time("getTotalSupply");
    const totalSupply: number = supplyStats.totalSupply;
    console.timeEnd("getTotalSupply");

    console.time("getSlowWalletsCountOverTime");
    const slowWalletsCountOverTime = await this.getSlowWalletsCountOverTime();
    console.timeEnd("getSlowWalletsCountOverTime");

    console.time("getBurnsOverTime");
    const burnOverTime = await this.getBurnsOverTime();
    console.timeEnd("getBurnsOverTime");

    console.time("getAccountsOnChainOverTime");
    const accountsOnChainOverTime = await this.getAccountsOnChainOverTime();
    console.timeEnd("getAccountsOnChainOverTime");

    console.time("getSupplyAndCapital");
    const supplyAndCapital = await this.getSupplyAndCapital(supplyStats);
    console.timeEnd("getSupplyAndCapital");

    console.time("getCommunityWalletsBalanceBreakdown");
    const communityWalletsBalanceBreakdown =
      await this.getCommunityWalletsBalanceBreakdown();
    console.timeEnd("getCommunityWalletsBalanceBreakdown");

    console.time("getLastEpochTotalUnlockedAmount");
    const lastEpochTotalUnlockedAmount =
      await this.getLastEpochTotalUnlockedAmount();
    console.timeEnd("getLastEpochTotalUnlockedAmount");

    console.time("getPOFValues");
    const pofValues = await this.getPOFValues(); // Empty table?
    console.timeEnd("getPOFValues");

    console.time("getLiquidSupplyConcentration");
    const liquidSupplyConcentration = await this.getLiquidSupplyConcentration();
    console.timeEnd("getLiquidSupplyConcentration");

    console.time("calculateLiquidityConcentrationLocked");
    const lockedSupplyConcentration =
      await this.calculateLiquidityConcentrationLocked();
    console.timeEnd("calculateLiquidityConcentrationLocked");

    console.time("getTopUnlockedBalanceWallets");
    const topAccounts = await this.getTopUnlockedBalanceWallets(
      100,
      supplyStats.circulatingSupply,
    );
    console.timeEnd("getTopUnlockedBalanceWallets");

    // calculate KPIS
    // circulating
    const circulatingSupply = {
      nominal: parseFloat(supplyStats.circulatingSupply.toFixed(3)),
      percentage: parseFloat(
        ((supplyStats.circulatingSupply / totalSupply) * 100).toFixed(3),
      ),
    };

    // CW
    const communityWalletsBalance = {
      nominal: parseFloat(supplyStats.cwSupply.toFixed(3)),
      percentage: parseFloat(
        ((supplyStats.cwSupply / totalSupply) * 100).toFixed(3),
      ),
    };

    // Locked
    const currentLockedOnSlowWallets = {
      nominal: parseFloat(supplyStats.slowLockedSupply.toFixed(3)),
      percentage: parseFloat(
        ((supplyStats.slowLockedSupply / totalSupply) * 100).toFixed(3),
      ),
    };

    // Validators escrow
    const infrastructureEscrow = {
      nominal: parseFloat(supplyStats.infraEscrowSupply.toFixed(3)),
      percentage: parseFloat(
        ((supplyStats.infraEscrowSupply / totalSupply) * 100).toFixed(3),
      ),
    };

    const totalBurned = {
      nominal: 100_000_000_000 - totalSupply,
      percentage: ((100_000_000_000 - totalSupply) / 100_000_000_000) * 100,
    };

    const lastEpochReward = {
      nominal:
        pofValues.nominalRewardOverTime[
          pofValues.nominalRewardOverTime.length - 1
        ].value,
      percentage:
        (pofValues.nominalRewardOverTime[
          pofValues.nominalRewardOverTime.length - 1
        ].value /
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
      rewardsOverTime: pofValues.nominalRewardOverTime, // net rewards? also available on the pofValues object
      clearingBidoverTime: pofValues.clearingBidOverTime, // net rewards? also available on the pofValues object
      liquidSupplyConcentration: liquidSupplyConcentration,
      lockedSupplyConcentration: lockedSupplyConcentration,
      topAccounts,

      // kpis
      circulatingSupply,
      totalBurned,
      communityWalletsBalance,
      currentSlowWalletsCount:
        slowWalletsCountOverTime[slowWalletsCountOverTime.length - 1].value,
      currentLockedOnSlowWallets,
      lastEpochTotalUnlockedAmount: {
        nominal: lastEpochTotalUnlockedAmount,
        percentage: (lastEpochTotalUnlockedAmount / totalSupply) * 100,
      },
      lastEpochReward,
      currentClearingBid:
        pofValues.clearingBidOverTime[pofValues.clearingBidOverTime.length - 1]
          .value / 10,
      infrastructureEscrow,
      lockedCoins,
    };
    return res;
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
          FROM "coin_balance"
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
      format: "JSONEachRow",
    });
    const rows = await resultSet.json<{
      balance: number;
      address: string;
    }>();

    return rows;
  }

  private async getCommunityWalletsBalanceBreakdown(): Promise<NameValue[]> {
    // List of addresses and their names
    const addressNames = [
      {
        address: "FBE8DA53C92CEEEB40D8967EC033A0FB",
        name: "Community development",
      },
      {
        address: "2640CD6D652AC94DC5F0963DCC00BCC7",
        name: "Engineering Fund, tool-scrubbers-guild",
      },
      {
        address: "C906F67F626683B77145D1F20C1A753B",
        name: "The Iqlusion Engineering Program",
      },
      {
        address: "3A6C51A0B786D644590E8A21591FA8E2",
        name: "FTW: Ongoing Full-Time Workers Program",
      },
      { address: "BCA50D10041FA111D1B44181A264A599", name: "A Good List" },
      { address: "2B0E8325DEA5BE93D856CFDE2D0CBA12", name: "Tip Jar" },
      {
        address: "19E966BFA4B32CE9B7E23721B37B96D2",
        name: "Social Infrastructure Program",
      },
      {
        address: "B31BD7796BC113013A2BF6C3953305FD",
        name: "Danish Red Cross Humanitarian Fund",
      },
      {
        address: "BC25F79FEF8A981BE4636AC1A2D6F587",
        name: "Application Studio",
      },
      { address: "2057BCFB0189B7FD0ABA7244BA271661", name: "Moonshot Program" },
      {
        address: "F605FE7F787551EEA808EE9ACDB98897",
        name: "Human Rewards Program",
      },
      {
        address: "C19C06A592911ED31C4100E9FB63AD7B",
        name: "RxC Research and Experimentation",
      },
      {
        address: "1367B68C86CB27FA7215D9F75A26EB8F",
        name: "University of Toronto MSRG",
      },
      {
        address: "BB6926434D1497A559E4F0487F79434F",
        name: "Deep Technology Innovation Program",
      },
      {
        address: "87DC2E497AC6EDAB21511333A421E5A5",
        name: "Working Group Key Roles",
      },
    ];

    // Extract just the addresses to use with getWalletsBalances
    const addresses = addressNames.map((entry) => entry.address);

    // Retrieve balances for these addresses
    const balances = await this.getWalletsBalances(addresses);

    // Map retrieved balances to their corresponding names and format the output
    const balanceBreakdown = addressNames.map(({ name, address }) => {
      const balanceEntry = balances.find((entry) => entry.address === address);
      return {
        name,
        value: balanceEntry ? balanceEntry.balance : 0, // Default to 0 if no balance found
      };
    });

    return balanceBreakdown;
  }

  private async getPOFValues(): Promise<{
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
        FROM consensus_reward
        ORDER BY version ASC
      `;

      const resultSet = await this.clickhouseService.client.query({
        query: query,
        format: "JSONEachRow",
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
        version: parseInt(String(row.version).replace("\n", ""), 10),
        nominalReward: parseFloat(String(row.nominalReward).replace("\n", "")),
        netReward: parseFloat(String(row.netReward).replace("\n", "")),
        clearingBid: parseFloat(String(row.clearingBid).replace("\n", "")),
      }));

      // Extract versions and convert them to timestamps
      const versions = cleanedRows.map((row) => row.version);
      const chunkSize = 1000; // Adjust chunk size as necessary
      const versionChunks = this.chunkArray<number>(versions, chunkSize);

      const allTimestampMappings: { version: number; timestamp: number }[] = [];

      for (const chunk of versionChunks) {
        const timestampsMap = await this.mapVersionsToTimestamps(chunk);
        allTimestampMappings.push(...timestampsMap);
      }

      // Helper to convert version to timestamp
      const convertVersionToTimestamp = (version: number) => {
        const timestampEntry = allTimestampMappings.find(
          (entry) => entry.version === version,
        );
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
      console.error("Error in getPOFValues:", error);
      throw error;
    }
  }

  private async getBurnsOverTime(): Promise<TimestampValue[]> {
    try {
      const query = `
        SELECT
          "version",
          divide("lifetime_burned", 1000000) AS "value"
        FROM "burn_counter"
        ORDER BY "version" ASC
      `;

      const resultSet = await this.clickhouseService.client.query({
        query: query,
        format: "JSONEachRow",
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
      const timestampsMap = await this.mapVersionsToTimestamps(versions);

      const burnsOverTime = rows.map((row) => {
        const version = parseInt(row.version, 10);
        const timestampEntry = timestampsMap.find(
          (entry) => entry.version === version,
        );
        const timestamp = timestampEntry ? timestampEntry.timestamp : 0;

        return {
          timestamp,
          value: row.value,
        };
      });

      const baseTimestamp = new Date("2023-11-28T00:00:00Z").getTime() / 1000;
      if (burnsOverTime[0].timestamp == 0) {
        burnsOverTime[0].timestamp = baseTimestamp;
      }

      return burnsOverTime.map((item) => ({
        timestamp: Math.round(item.timestamp),
        value: item.value,
      }));
    } catch (error) {
      console.error("Error in getBurnsOverTime:", error);
      throw error;
    }
  }

  private async getSlowWalletsUnlockedAmount(): Promise<number> {
    try {
      const query = `
        SELECT
          hex(SW.address) AS address,
        (latest_balance - max(SW.unlocked)) / 1e6 AS locked_balance
        FROM
          slow_wallet SW
        JOIN
          (SELECT
            address,
            argMax(balance, timestamp) as latest_balance
          FROM coin_balance
          WHERE coin_module = 'libra_coin'
          GROUP BY address) AS CB
        ON SW.address = CB.address
        GROUP BY SW.address, latest_balance
      `;

      const resultSet = await this.clickhouseService.client.query({
        query: query,
        format: "JSONEachRow",
      });

      const rows = await resultSet.json<{ locked_balance: number }>();

      // Sum the locked Amount
      const totalLockedAmount = rows.reduce(
        (acc, row) => acc + row.locked_balance,
        0,
      );

      return totalLockedAmount;
    } catch (error) {
      console.error("Error in getSlowWalletsUnlockedAmount:", error);
      throw error;
    }
  }

  private async getLastEpochTotalUnlockedAmount(): Promise<number> {
    try {
      // Query the slow_wallet table to get the addresses and unlocked balances
      const slowWalletQuery = `
        SELECT
          hex(SW.address) AS address,
          max(SW.unlocked) / 1e6 AS unlocked_balance
        FROM slow_wallet SW
        GROUP BY SW.address
      `;

      const slowWalletResultSet = await this.clickhouseService.client.query({
        query: slowWalletQuery,
        format: "JSONEachRow",
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
      const addressChunks = this.chunkArray<string>(addresses, 1000); // Adjust chunk size as necessary
      const balanceResults: { address: string; latest_balance: number }[] = [];

      for (const chunk of addressChunks) {
        const formattedAddresses = chunk.map((addr) => `'${addr}'`).join(",");
        const balanceQuery = `
          SELECT
            hex(address) AS address,
            argMax(balance, version) / 1e6 AS latest_balance
          FROM coin_balance
          WHERE coin_module = 'libra_coin' AND address IN (${formattedAddresses})
          GROUP BY address
        `;

        const balanceResultSet = await this.clickhouseService.client.query({
          query: balanceQuery,
          format: "JSONEachRow",
        });

        const balanceRows = await balanceResultSet.json<{
          address: string;
          latest_balance: number;
        }>();
        balanceResults.push(...balanceRows);
      }

      // Create a map of address to latest balance
      const balanceMap = new Map(
        balanceResults.map((row) => [row.address, row.latest_balance]),
      );

      // Combine data from both queries
      const lockedBalances = slowWalletRows.map((row) => {
        const latest_balance = balanceMap.get(row.address) ?? 0;
        const unlocked_balance = row.unlocked_balance;
        const locked_balance = latest_balance - unlocked_balance;
        // console.log(`Address: ${row.address}, Latest Balance: ${latest_balance}, Unlocked Balance: ${unlocked_balance}, Locked Balance: ${locked_balance}`);
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
      console.error("Error in getLastEpochTotalUnlockedAmount:", error);
      throw error;
    }
  }

  // HELPER METHODS

  private chunkArray<T>(array: T[], chunkSize: number): T[][] {
    const results: T[][] = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      results.push(array.slice(i, i + chunkSize));
    }
    return results;
  }

  private async mapVersionsToTimestamps(
    versions: number[],
  ): Promise<{ version: number; timestamp: number }[]> {
    const versionsString = versions.join(", ");
    const query = `
      WITH

        "gen_txs" AS (
          SELECT ("version" + 1) as "version"
          FROM "genesis_transaction"
          WHERE
          "genesis_transaction"."version" IN (${versionsString})
        ),

        "txs" AS (
          SELECT "timestamp", "version"
          FROM "block_metadata_transaction"
          WHERE "version" IN (SELECT "version" FROM "gen_txs")

          UNION ALL

          SELECT "timestamp", "version"
          FROM "state_checkpoint_transaction"
          WHERE "version" IN (SELECT "version" FROM "gen_txs")

          UNION ALL

          SELECT "timestamp", "version"
          FROM "user_transaction"
          WHERE "version" IN (SELECT "version" FROM "gen_txs")

          UNION ALL

          SELECT "timestamp", "version"
          FROM "script"
          WHERE "version" IN (SELECT "version" FROM "gen_txs")

        ),

        "tx_timestamps" AS (
          SELECT
            toUInt64("txs"."timestamp" - 1) as "timestamp",
            toUInt64("version" - 1) as "version"
          FROM "txs"

          UNION ALL

          SELECT "timestamp", "version"
          FROM "block_metadata_transaction"
          WHERE "version" IN (${versionsString})

          UNION ALL

          SELECT "timestamp", "version"
          FROM "state_checkpoint_transaction"
          WHERE "version" IN (${versionsString})

          UNION ALL

          SELECT "timestamp", "version"
          FROM "user_transaction"
          WHERE "version" IN (${versionsString})

          UNION ALL

          SELECT "timestamp", "version"
          FROM "script"
          WHERE "version" IN (${versionsString})
        )

        SELECT "timestamp", "version"
        FROM "tx_timestamps"
        ORDER BY "version" ASC
    `;
    const resultSet = await this.clickhouseService.client.query({
      query,
      query_params: { versions },
      format: "JSONEachRow",
    });

    const rows = await resultSet.json<{
      timestamp: string;
      version: string;
    }>();

    return rows.map((row) => ({
      version: parseInt(row.version, 10),
      timestamp: parseInt(row.timestamp, 10) / 1_000_000, // Convert to seconds
    }));
  }

  public async getSlowWalletsCountOverTime(): Promise<TimestampValue[]> {
    try {
      const resultSet = await this.clickhouseService.client.query({
        query: `
              SELECT
                "version",
                "list_count" AS "value"
              FROM "slow_wallet_list"
              ORDER BY "version" ASC
            `,
        format: "JSONEachRow",
      });
      const rows = await resultSet.json<{
        version: string;
        value: string;
      }>();

      if (!rows.length) {
        console.warn("No data found for slow wallets over time.");
        return [];
      }

      // Extract versions and convert them to timestamps
      const versions = rows.map((row) => parseInt(row.version, 10));
      const timestampsMap = await this.mapVersionsToTimestamps(versions);

      const slowWalletsOverTime = rows.map((row) => {
        const version = parseInt(row.version, 10);
        const timestampEntry = timestampsMap.find(
          (entry) => entry.version === version,
        );
        const timestamp = timestampEntry ? timestampEntry.timestamp : 0;

        return {
          timestamp,
          value: parseInt(row.value, 10),
        };
      });

      const baseTimestamp = new Date("2023-11-28T00:00:00Z").getTime() / 1000;
      if (slowWalletsOverTime[0].timestamp == 0) {
        slowWalletsOverTime[0].timestamp = baseTimestamp;
      }

      const result = slowWalletsOverTime.map((item) => ({
        timestamp: Math.round(item.timestamp),
        value: item.value,
      }));

      return result;
    } catch (error) {
      console.error("Error in getSlowWalletsCountOverTime:", error);
      throw error;
    }
  }

  private async getAccountsOnChainOverTime(): Promise<TimestampValue[]> {
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
        format: "JSONEachRow",
      });

      const rows = await resultSet.json<{
        version: string;
        address: string;
      }>();

      if (!rows.length) {
        return [];
      }

      // Extract versions
      const versions = rows.map((row) => parseInt(row.version, 10));

      // Split versions into smaller chunks to avoid query length issues
      const chunkSize = 1000; // Adjust chunk size as necessary
      const versionChunks = this.chunkArray<number>(versions, chunkSize);

      // Process each chunk concurrently
      const allTimestampMappings = (
        await Promise.all(
          versionChunks.map((chunk) => this.mapVersionsToTimestamps(chunk)),
        )
      ).flat();

      // Use a Map for faster version-to-timestamp lookup
      const versionToTimestampMap = new Map<number, number>(
        allTimestampMappings.map(({ version, timestamp }) => [
          version,
          timestamp,
        ]),
      );

      // Initialize the result array and a count for accounts with timestamp > 0
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
      console.error("Error in getAccountsOnChainOverTime:", error);
      throw error;
    }
  }

  public async getAccountsStats(): Promise<{
    totalAccounts: number;
    activeAddressesCount: {
      lastDay: number;
      last30Days: number;
      last90Days: number;
    };
  }> {
    const totalAccounts = await this.getTotalUniqueAccounts();
    const activeAddressesCount = await this.getActiveAddressesCount();
    return { totalAccounts, activeAddressesCount };
  }

  public async getActiveAddressesCount(): Promise<{
    lastDay: number;
    last30Days: number;
    last90Days: number;
  }> {
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
        format: "JSONEachRow",
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

      const versions = rows.map((row) => parseInt(row.version, 10));
      const chunkSize = 1000;
      const versionChunks = this.chunkArray<number>(versions, chunkSize);
      const allTimestampMappings = (
        await Promise.all(
          versionChunks.map((chunk) => this.mapVersionsToTimestamps(chunk)),
        )
      ).flat();

      const versionToTimestampMap = new Map<number, number>(
        allTimestampMappings.map(({ version, timestamp }) => [
          version,
          timestamp,
        ]),
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
      console.error("Error in getActiveAddressesCount:", error);
      throw error;
    }
  }

  public async getTotalUniqueAccounts(): Promise<number> {
    try {
      const query = `
        SELECT COUNT(DISTINCT address) AS unique_accounts
        FROM coin_balance
        WHERE coin_module = 'libra_coin'
      `;

      const resultSet = await this.clickhouseService.client.query({
        query: query,
        format: "JSONEachRow",
      });

      const rows = await resultSet.json<{ unique_accounts: number }[]>();

      if (rows.length === 0) {
        return 0;
      }
      const uniqueAccountsCount = Number(rows[0]["unique_accounts"]);

      return uniqueAccountsCount;
    } catch (error) {
      console.error("Error in getTotalUniqueAccounts:", error);
      throw error;
    }
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
      // Organize the values into the specified structure
      const supplyAllocation = [
        { name: "Community Wallets", value: communityWalletsBalances },
        { name: "Locked", value: slowLocked },
        { name: "Infrastructure escrow", value: infraEscrowBalance },
        { name: "Circulating", value: circulating },
      ];

      const individualsCapital = [
        { name: "Locked", value: slowLocked },
        { name: "Circulating", value: circulating },
      ];

      const communityCapital = [
        { name: "Community Wallets", value: communityWalletsBalances },
        { name: "Infrastructure escrow", value: infraEscrowBalance },
      ];

      return {
        supplyAllocation,
        individualsCapital,
        communityCapital,
      };
    } catch (error) {
      console.error("Error in getSupplyAndCapital:", error);
      throw error;
    }
  }

  // Liquidity concentration

  private async getLiquidSupplyConcentration() {
    // Fetch community wallets to exclude
    const communityWallets = await this.olService.getCommunityWallets();
    // Fetch slow wallets' unlocked balances
    const slowWalletsUnlockedBalances =
      await this.getSlowWalletsUnlockedBalances();
    // Fetch all other wallets' balances, excluding community wallets and including adjustments for slow wallets
    const allWalletsBalances = await this.getAllWalletsBalances(
      communityWallets,
      slowWalletsUnlockedBalances,
    );
    // Bin the balances into the specified ranges
    const bins = this.binBalances(allWalletsBalances);

    return bins;
  }

  private async getSlowWalletsUnlockedBalances(): Promise<
    { address: string; unlockedBalance: number }[]
  > {
    try {
      // Query to get the latest balances and versions
      const query = `
      SELECT
        address,
        argMax(balance, version) AS latest_balance,
        max(version) AS latest_version
      FROM coin_balance
      WHERE coin_module = 'libra_coin'
      GROUP BY address
    `;

      const resultSet = await this.clickhouseService.client.query({
        query: query,
        format: "JSONEachRow",
      });

      const rows = await resultSet.json<{
        address: string;
        latest_balance: number;
        latest_version: number;
      }>();

      if (!rows.length) {
        return [];
      }

      // Extract versions and convert them to timestamps
      const versions = rows.map((row) => row.latest_version);
      const chunkSize = 1000; // Adjust chunk size as necessary
      const versionChunks = this.chunkArray<number>(versions, chunkSize);

      const allTimestampMappings = (
        await Promise.all(
          versionChunks.map((chunk) => this.mapVersionsToTimestamps(chunk)),
        )
      ).flat();

      // Use a Map for faster version-to-timestamp lookup
      const versionToTimestampMap = new Map<number, number>(
        allTimestampMappings.map(({ version, timestamp }) => [
          version,
          timestamp,
        ]),
      );

      // Create a map of address to latest balance and timestamp
      const addressBalanceMap = new Map<
        string,
        { latest_balance: number; timestamp: number }
      >();
      rows.forEach((row) => {
        const version = row.latest_version;
        const timestamp = versionToTimestampMap.get(version) ?? 0;
        addressBalanceMap.set(row.address, {
          latest_balance: row.latest_balance / 1e6,
          timestamp,
        });
      });

      // Query the slow_wallet table and join with the addressBalanceMap data
      const slowWalletQuery = `
      SELECT
        hex(SW.address) AS address,
        max(SW.unlocked) / 1e6 AS unlocked_balance
      FROM slow_wallet SW
      GROUP BY SW.address
    `;

      const slowWalletResultSet = await this.clickhouseService.client.query({
        query: slowWalletQuery,
        format: "JSONEachRow",
      });

      const slowWalletRows = await slowWalletResultSet.json<{
        address: string;
        unlocked_balance: number;
      }>();

      // Combine data from both queries
      const result = slowWalletRows.map((row) => {
        const addressData = addressBalanceMap.get(row.address);
        if (addressData) {
          return {
            address: row.address,
            unlockedBalance: Math.min(
              row.unlocked_balance,
              addressData.latest_balance,
            ),
          };
        } else {
          return {
            address: row.address,
            unlockedBalance: row.unlocked_balance,
          };
        }
      });

      // Ensure all balances are non-negative
      return result.map((row) => ({
        address: row.address,
        unlockedBalance: Math.max(0, row.unlockedBalance),
      }));
    } catch (error) {
      console.error("Error in getSlowWalletsUnlockedBalances:", error);
      throw error;
    }
  }

  private async getAllWalletsBalances(
    communityWallets: string[],
    slowWalletsUnlockedBalances: { address: string; unlockedBalance: number }[],
  ): Promise<{ address: string; balance: number }[]> {
    try {
      function getLast15Chars(address: string): string {
        return address.slice(-15).toUpperCase();
      }

      // Convert community wallets to a Set for easy lookup
      const communityAddresses = new Set(
        communityWallets.map((wallet) => wallet.toUpperCase()),
      );

      // Convert slow wallets to a map for easy access
      const slowWalletsMap = new Map(
        slowWalletsUnlockedBalances.map((wallet) => [
          wallet.address.toUpperCase(),
          wallet.unlockedBalance,
        ]),
      );

      // Query to fetch balances for all wallets, excluding community wallets
      const query = `
        SELECT
          hex(address) AS address,
          argMax(balance, version) / 1e6 AS balance,
          max(version) AS latest_version
        FROM coin_balance
        WHERE coin_module = 'libra_coin'
        GROUP BY address
      `;

      const resultSet = await this.clickhouseService.client.query({
        query: query,
        format: "JSONEachRow",
      });

      const rows = await resultSet.json<{
        address: string;
        balance: number;
        latest_version: number;
      }>();

      if (!rows.length) {
        return [];
      }

      // Create a map of address to latest balance, excluding community wallets
      const addressBalanceMap = new Map<string, number>();
      rows.forEach((row) => {
        const address = row.address.toUpperCase();
        if (!communityAddresses.has(address)) {
          addressBalanceMap.set(address, row.balance);
        }
      });

      // Adjust balances for slow wallets
      slowWalletsUnlockedBalances.forEach((row) => {
        const address = getLast15Chars(row.address);
        for (const [key, value] of addressBalanceMap.entries()) {
          if (getLast15Chars(key) === address) {
            addressBalanceMap.set(key, row.unlockedBalance);
            break;
          }
        }
      });

      // Convert the map to an array
      const result = Array.from(addressBalanceMap.entries()).map(
        ([address, balance]) => ({
          address,
          balance,
        }),
      );

      return result;
    } catch (error) {
      console.error("Error in getAllWalletsBalances:", error);
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
        // Handle the "and above" case for the last bin
        name = `${range.min} and above`;
      }
      return { name, value: 0 };
    });

    balances.forEach((item) => {
      const binIndex = ranges.findIndex(
        (range) =>
          item.balance >= range.min &&
          (item.balance <= range.max || range.max === Infinity),
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

  // Locked concentration
  // Main method to calculate liquidity concentration for locked balances
  private async calculateLiquidityConcentrationLocked(): Promise<any> {
    const lockedBalances = await this.getLockedBalancesForSlowWallets();
    const accountsLocked =
      this.calculateLockedBalancesConcentration(lockedBalances);
    const avgTotalVestingTime =
      this.calculateAvgTotalVestingTime(accountsLocked);
    return {
      accountsLocked,
      avgTotalVestingTime,
    };
  }

  private async getLockedBalancesForSlowWallets(): Promise<LockedBalance[]> {
    try {
      const slowWalletAddresses = await this.getSlowWalletAddresses();

      const walletsBalances =
        await this.getWalletsBalances(slowWalletAddresses);

      const unlockedBalances = await this.getSlowWalletsUnlockedBalances();

      const lockedBalances = walletsBalances
        .map((wallet) => {
          const unlockedAmount =
            unlockedBalances.find((u) => u.address === wallet.address)
              ?.unlockedBalance || 0;
          const lockedBalanceCalculation = wallet.balance - unlockedAmount;

          return {
            address: wallet.address,
            lockedBalance: Math.max(0, lockedBalanceCalculation), // Ensure locked balance is not negative
          };
        })
        .filter((wallet) => wallet.lockedBalance > 0); // Ensure wallets with zero locked balance are filtered out

      return lockedBalances;
    } catch (error) {
      console.error("Error in getLockedBalancesForSlowWallets:", error);
      throw error;
    }
  }

  private async getSlowWalletAddresses(): Promise<string[]> {
    try {
      const query = `
        SELECT DISTINCT hex(address) AS address
        FROM slow_wallet
      `;

      const resultSet = await this.clickhouseService.client.query({
        query: query,
        format: "JSONEachRow",
      });

      const rows = await resultSet.json<{ address: string }>();

      const addresses = rows.map((row) => row.address);

      return addresses;
    } catch (error) {
      console.error("Error in getSlowWalletAddresses:", error);
      throw error;
    }
  }

  private calculateLockedBalancesConcentration(
    lockedBalances: LockedBalance[],
  ): BinRange[] {
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
      // Extract the lower and upper bounds from the bin name
      let lower, upper;
      if (bin.name.includes("and above")) {
        // For "and above" case, extract the lower bound and use it as both lower and upper for simplicity
        lower = Number(bin.name.split(" ")[0]);
        upper = lower; // This simplification might need adjustment based on actual data distribution
      } else {
        [lower, upper] = bin.name.split(" - ").map(Number);
      }

      const middleValue = (lower + (upper || lower)) / 2;
      // Calculate vesting time in days
      const vestingDays = middleValue / 35000;
      const vestingMonths = vestingDays / 30;
      return {
        name: bin.name,
        value: Math.round(vestingMonths * 100) / 100, // Round to two decimal places for readability
      };
    });
  }

  private async getTopUnlockedBalanceWallets(
    limit: number,
    circulatingSupply: number,
  ): Promise<
    { address: string; unlockedBalance: number; percentOfCirculating: number }[]
  > {
    try {
      function toHexString(decimalString: string): string {
        return BigInt(decimalString).toString(16).toUpperCase();
      }

      function getLast15Chars(address: string): string {
        return address.slice(-15).toUpperCase();
      }

      // Get the list of community wallets
      const communityWallets =
        await this.communityWalletsService.getCommunityWallets();
      const communityAddresses = new Set(
        communityWallets.map((wallet) => wallet.address),
      );

      // Query to get the latest balances and versions from coin_balance
      const coinBalanceQuery = `
        SELECT
          address,
          argMax(balance, version) AS latest_balance
        FROM coin_balance
        WHERE coin_module = 'libra_coin'
        GROUP BY address
      `;

      const coinBalanceResultSet = await this.clickhouseService.client.query({
        query: coinBalanceQuery,
        format: "JSONEachRow",
      });

      const coinBalanceRows: Array<{
        address: string;
        latest_balance: number;
      }> = await coinBalanceResultSet.json();

      if (!coinBalanceRows.length) {
        return [];
      }

      // Create a map of address to latest balance
      const addressBalanceMap = new Map<string, number>();
      coinBalanceRows.forEach((row) => {
        const address = toHexString(row.address).toUpperCase();
        if (!communityAddresses.has(address)) {
          addressBalanceMap.set(address, row.latest_balance / 1e6);
        }
      });

      // Query to get the latest unlocked balances from slow_wallet
      const slowWalletQuery = `
        SELECT
          hex(address) AS address,
          argMax(unlocked, version) / 1e6 AS unlocked_balance
        FROM slow_wallet
        GROUP BY address
      `;

      const slowWalletResultSet = await this.clickhouseService.client.query({
        query: slowWalletQuery,
        format: "JSONEachRow",
      });

      const slowWalletRows: Array<{
        address: string;
        unlocked_balance: number;
      }> = await slowWalletResultSet.json();

      // Adjust balances: replace balance with unlocked balance for slow wallets
      slowWalletRows.forEach((row) => {
        const address = getLast15Chars(row.address);
        for (const [key, value] of addressBalanceMap.entries()) {
          if (getLast15Chars(key) === address) {
            addressBalanceMap.set(key, row.unlocked_balance);
            break;
          }
        }
      });

      // Convert the map to an array and calculate percentOfCirculating
      const result = Array.from(addressBalanceMap.entries()).map(
        ([address, unlockedBalance]) => ({
          address,
          unlockedBalance,
          percentOfCirculating: (unlockedBalance / circulatingSupply) * 100,
        }),
      );

      // Sort by unlockedBalance and take the top N
      result.sort((a, b) => b.unlockedBalance - a.unlockedBalance);
      return result.slice(0, limit);
    } catch (error) {
      console.error("Error in getTopUnlockedBalanceWallets:", error);
      throw error;
    }
  }
}
