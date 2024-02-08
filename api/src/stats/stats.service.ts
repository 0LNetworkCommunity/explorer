import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

import {
  Stats,
  TimestampValue,
  NameValue,
  WalletBalance,
  LockedBalance,
  BinRange,
  BalanceItem,
} from "./types.js";
import { ClickhouseService } from "../clickhouse/clickhouse.service.js";
import { OlService } from "../ol/ol.service.js";

@Injectable()
export class StatsService {
  private readonly dataApiHost: string;

  public constructor(
    private readonly clickhouseService: ClickhouseService,
    private readonly olService: OlService,
    config: ConfigService,
  ) {
    this.dataApiHost = config.get('dataApiHost')!
  }

  public async getStats(): Promise<Stats> {
    const slowWalletsCountOverTime = await this.getSlowWalletsCountOverTime();
    const burnOverTime = await this.getBurnsOverTime();
    const accountsOnChainOverTime = await this.getAccountsOnChainOverTime();
    const supplyAndCapital = await this.getSupplyAndCapital();
    const communityWalletsBalanceBreakdown =
      await this.getCommunityWalletsBalanceBreakdown();
    const lastEpochTotalUnlockedAmount =
      await this.getLastEpochTotalUnlockedAmount();
    const pofValues = await this.getPOFValues(); // Empty table?
    const liquidSupplyConcentration = await this.getLiquidSupplyConcentration();
    const lockedSupplyConcentration =
      await this.calculateLiquidityConcentrationLocked();

    // calculate KPIS
    const totalSupply = supplyAndCapital.supplyAllocation.reduce((acc, {value}) => acc + value, 0);
    // circulating
    const circulatingEntry = supplyAndCapital.supplyAllocation.find(entry => entry.name === "Circulating");
    const circulatingValue = circulatingEntry ? circulatingEntry.value : 0;
    const circulatingPercentage = (circulatingValue / totalSupply) * 100;
    const circulatingSupply = {
      nominal: circulatingValue,
      percentage: parseFloat(circulatingPercentage.toFixed(4))
    };

    // CW
    const communityWalletsEntry = supplyAndCapital.supplyAllocation.find(entry => entry.name === "Community Wallets");
    const communityWalletsValue = communityWalletsEntry ? communityWalletsEntry.value : 0;
    const communityWalletsPercentage = (communityWalletsValue / totalSupply) * 100;
    const communityWalletsBalance = {
      nominal: communityWalletsValue,
      percentage: parseFloat(communityWalletsPercentage.toFixed(4))
    };

    // Locked
    const lockedEntry = supplyAndCapital.supplyAllocation.find(entry => entry.name === "Locked");
    const lockedValue = lockedEntry ? lockedEntry.value : 0;
    const lockedPercentage = (lockedValue / totalSupply) * 100;
    const currentLockedOnSlowWallets = {
      nominal: lockedValue,
      percentage: parseFloat(lockedPercentage.toFixed(4))
    };

    const totalBurned = {
      nominal: 100_000_000_000 - totalSupply,
      percentage: (100_000_000_000 - totalSupply) / 100_000_000_000
    };

    const lastEpochReward = {
      nominal: pofValues.nominalRewardOverTime[pofValues.nominalRewardOverTime.length - 1].value,
      percentage: (pofValues.nominalRewardOverTime[pofValues.nominalRewardOverTime.length - 1].value / totalSupply) * 100
    };

    const lockedCoins = await (await fetch(`${this.dataApiHost}/locked-coins`)).json();

    return {
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
      
      // kpis
      circulatingSupply,
      totalBurned,
      communityWalletsBalance,
      currentSlowWalletsCount: slowWalletsCountOverTime[slowWalletsCountOverTime.length - 1].value,
      currentLockedOnSlowWallets,
      lastEpochTotalUnlockedAmount: {
        nominal: lastEpochTotalUnlockedAmount,
        percentage: (lastEpochTotalUnlockedAmount / totalSupply) * 100
      },
      lastEpochReward,
      currentClearingBid: (pofValues.clearingBidOverTime[pofValues.clearingBidOverTime.length - 1].value) / 10,
      lockedCoins,
    };
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
    const rows = await resultSet.json<
      {
        balance: number;
        address: string;
      }[]
    >();

    return rows;
  }

  private async getTotalSupply(): Promise<number> {
    try {
      const resultSet = await this.clickhouseService.client.query({
        query: `
          SELECT
            "amount" / 1e6 AS "totalSupply"
          FROM "total_supply"
          ORDER BY
            "version" DESC,
            "change_index"
          DESC limit 1
        `,
        format: "JSONEachRow",
      });
      const rows = await resultSet.json<
        {
          totalSupply: number;
        }[]
      >();
      if (!rows.length) {
        return 0;
      }
      return rows[0].totalSupply;
    } catch (error) {
      console.error("Error in getTotalSupply:", error);
      throw error; // Rethrow the error after logging
    }
  }

  // Calculates the libra balances of all accounts
  private async getTotalLibraBalances(): Promise<number> {
    try {
      const query = `
        SELECT
            SUM(latest_balance) / 1e6 AS total_balance
        FROM (
            SELECT 
                argMax(balance, version) AS latest_balance
            FROM coin_balance
            WHERE coin_module = 'libra_coin'
            GROUP BY address
        )
      `;

      const resultSet = await this.clickhouseService.client.query({
        query: query,
        format: "JSONEachRow",
      });

      const result = await resultSet.json<{ total_balance: number }[]>();

      // Assuming there's only one row returned
      if (result.length > 0) {
        return result[0].total_balance;
      }
      return 0;
    } catch (error) {
      console.error("Error in getTotalBalances:", error);
      throw error;
    }
  }

  private async getCommunityWalletsBalance(): Promise<number> {
    const communityWallets = await this.olService.getCommunityWallets();
    const communityWalletsRecords =
      await this.getWalletsBalances(communityWallets);
    const communityWalletsBalances = communityWalletsRecords.reduce(
      (acc, row) => acc + row.balance,
      0,
    );
    return communityWalletsBalances;
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
          timestamp,
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

      const rows = await resultSet.json<
        {
          timestamp: string; // Adjusted to string to match your input
          nominalReward: number;
          netReward: number;
          clearingBid: number;
        }[]
      >();

      // Convert timestamp from microseconds to seconds and ensure it's an integer
      const convertTimestamp = (timestamp: string) =>
        Math.floor(Number(timestamp) / 1e6);

      // Set the base timestamp for the first entry
      const baseTimestamp = new Date("2023-11-28T00:00:00Z").getTime() / 1000;

      // Helper to adjust first timestamp
      const adjustFirstTimestamp = (array: Array<TimestampValue>) => {
        if (array.length > 0) {
          array[0].timestamp = baseTimestamp;
        }
        return array;
      };

      // Transform the data into the desired format and adjust timestamps
      const clearingBidOverTime = adjustFirstTimestamp(
        rows.map((row) => ({
          timestamp: convertTimestamp(row.timestamp),
          value: row.clearingBid,
        })),
      );
      const nominalRewardOverTime = adjustFirstTimestamp(
        rows.map((row) => ({
          timestamp: convertTimestamp(row.timestamp),
          value: row.nominalReward,
        })),
      );
      const netRewardOverTime = adjustFirstTimestamp(
        rows.map((row) => ({
          timestamp: convertTimestamp(row.timestamp),
          value: row.netReward,
        })),
      );

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
          toInt32(divide("timestamp", 1000000)) AS "timestamp", // Convert to Unix timestamp
          divide("lifetime_burned", 1000000) AS "value" // Divide by 1e6
        FROM "burn_counter"
        ORDER BY "timestamp"
      `;

      const resultSet = await this.clickhouseService.client.query({
        query: query,
        format: "JSONEachRow",
      });

      const rows = await resultSet.json<
        {
          timestamp: number;
          value: number;
        }[]
      >();

      if (!rows.length) {
        return [];
      }

      const baseTimestamp = new Date("2023-11-28T00:00:00Z").getTime() / 1000;
      if (rows[0].timestamp == 0) {
        rows[0].timestamp = baseTimestamp;
      }

      return rows.map((row) => ({
        timestamp: row.timestamp,
        value: row.value,
      }));
    } catch (error) {
      console.error("Error in getBurnsOverTime:", error);
      throw error;
    }
  }

  private async getSlowWalletsLockedAmount(): Promise<number> {
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

      const rows = await resultSet.json<{ locked_balance: number }[]>();

      // Sum the locked balances
      const totalLockedAmount = rows.reduce(
        (acc, row) => acc + row.locked_balance,
        0,
      );

      return totalLockedAmount;
    } catch (error) {
      console.error("Error in getSlowWalletsLockedAmount:", error);
      throw error;
    }
  }

  private async getLastEpochTotalUnlockedAmount(): Promise<number> {
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

      const rows = await resultSet.json<{ locked_balance: number }[]>();

      // Count the wallets with locked balance greater than 35000
      const count = rows.reduce(
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

  private async getSlowWalletsCountOverTime(): Promise<TimestampValue[]> {
    try {
      const resultSet = await this.clickhouseService.client.query({
        query: `
              SELECT
                "timestamp",
                "list_count" AS "value"
              FROM "slow_wallet_list"
              ORDER BY "timestamp" ASC
            `,
        format: "JSONEachRow",
      });
      const rows = await resultSet.json<
        {
          timestamp: string;
          value: string;
        }[]
      >();

      if (!rows.length) {
        console.warn("No data found for slow wallets over time.");
        return [];
      }

      // Convert to desired structure with number conversion
      const slowWalletsOverTime = rows.map((row) => ({
        timestamp: parseInt(row.timestamp, 10) / 1_000_000,
        value: parseInt(row.value, 10),
      }));

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
      console.error("Error in getSlowWalletsOverTime:", error);
      throw error;
    }
  }

  private async getAccountsOnChainOverTime(): Promise<TimestampValue[]> {
    try {
      const query = `
        SELECT 
          toInt32(divide(min(timestamp), 1000000)) AS timestamp,
          address
        FROM coin_balance
        WHERE coin_module = 'libra_coin'
        GROUP BY address
        ORDER BY timestamp ASC
      `;

      const resultSet = await this.clickhouseService.client.query({
        query: query,
        format: "JSONEachRow",
      });

      const rows = await resultSet.json<
        {
          timestamp: number;
          address: string;
        }[]
      >();

      // Initialize the result array and a count for accounts with timestamp > 0
      const accountsOverTime: TimestampValue[] = [];
      let countOfZeroTimestamps = 0;
      let cumulativeCount = 0;

      rows.forEach((row) => {
        if (row.timestamp == 0) {
          countOfZeroTimestamps++;
        } else {
          // This is the first record after all the 0 timestamps have been counted
          if (accountsOverTime.length === 0 && countOfZeroTimestamps > 0) {
            // Unix timestamp for November 29th, 2023, at midnight UTC, representing the accounts that came from v5.2
            const unixTimestampForNov29 =
              new Date("2023-11-29T00:00:00Z").getTime() / 1000;
            accountsOverTime.push({
              timestamp: unixTimestampForNov29,
              value: countOfZeroTimestamps,
            });
            cumulativeCount = countOfZeroTimestamps;
          }
          cumulativeCount++; // Increment for each unique address with timestamp > 0
          accountsOverTime.push({
            timestamp: row.timestamp,
            value: cumulativeCount,
          });
        }
      });

      return accountsOverTime;
    } catch (error) {
      console.error("Error in getAccountsOnChainOverTime:", error);
      throw error;
    }
  }

  private async getSupplyAndCapital(): Promise<{
    supplyAllocation: NameValue[];
    individualsCapital: NameValue[];
    communityCapital: NameValue[];
  }> {
    try {
      // Call the provided helper methods
      const totalSupply = await this.getTotalSupply();
      const totalSlowWalletLocked = await this.getSlowWalletsLockedAmount();
      const communityWalletsBalances = await this.getCommunityWalletsBalance();
      const totalLibraBalances = await this.getTotalLibraBalances();

      // Calculate additional values
      const infraEscrowBalance = totalSupply - totalLibraBalances;
      const circulating =
        totalLibraBalances - (totalSlowWalletLocked + communityWalletsBalances);

      // Organize the results into the specified structure
      const supplyAllocation = [
        { name: "Community Wallets", value: communityWalletsBalances },
        { name: "Locked", value: totalSlowWalletLocked },
        { name: "Infrastructure escrow", value: infraEscrowBalance },
        { name: "Circulating", value: circulating },
      ];

      const individualsCapital = [
        { name: "Locked", value: totalSlowWalletLocked },
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
      const query = `
        SELECT
          hex(SW.address) AS address,
          IF(latest_balance > max(SW.unlocked), max(SW.unlocked) / 1e6, latest_balance / 1e6) AS unlocked_balance
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

      const rows =
        await resultSet.json<{ address: string; unlocked_balance: number }[]>();

      // Adjust the balance based on the unlocked amount
      return rows.map((row) => ({
        address: row.address,
        unlockedBalance: Math.max(0, row.unlocked_balance), // Corrected field name to match the query result
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
      // Convert community wallets to a format suitable for the SQL query
      const communityWalletsFormatted = communityWallets
        .map((wallet) => `'${wallet}'`)
        .join(",");

      // Convert slow wallets to a map for easy access
      const slowWalletsMap = new Map(
        slowWalletsUnlockedBalances.map((wallet) => [
          wallet.address,
          wallet.unlockedBalance,
        ]),
      );

      // Query to fetch balances for all wallets, excluding community wallets
      const query = `
        SELECT
          hex(address) AS address,
          argMax(balance, timestamp) / 1e6 AS balance
          FROM coin_balance
          WHERE coin_module = 'libra_coin'
          AND NOT has([${communityWalletsFormatted}], hex(address))
        GROUP BY address
      `;

      const resultSet = await this.clickhouseService.client.query({
        query: query,
        format: "JSONEachRow",
      });

      let rows = await resultSet.json<{ address: string; balance: number }[]>();

      // Adjust balances for slow wallets
      rows = rows.map((row) => {
        const unlockedBalance = slowWalletsMap.get(row.address);
        // Check if there's an unlocked balance, if not, use the original balance
        if (unlockedBalance !== undefined) {
          return { address: row.address, balance: unlockedBalance };
        }
        return row;
      });

      return rows;
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

      const rows = await resultSet.json<{ address: string }[]>();

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
}
