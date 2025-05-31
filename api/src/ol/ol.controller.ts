import { Controller, Get, Param, Logger } from '@nestjs/common';
import { ClickhouseService } from '../clickhouse/clickhouse.service.js';

// Version 0's timestamp is calculated by dedubting the intervation between epoch 2 and 3 to epoch 2's timestamp.
//
// ┌─version─┬────────timestamp─┬─creation_number─┬─account_address─┬─sequence_number─┬─module_address─┬─module_name─────┬─struct_name───┬─data──────────┐
// │       0 │                0 │               2 │               1 │               0 │              1 │ reconfiguration │ NewEpochEvent │ {"epoch":"1"} │
// │       3 │ 1701289679612335 │               2 │               1 │               1 │              1 │ reconfiguration │ NewEpochEvent │ {"epoch":"2"} │
// │  383074 │ 1701376079939922 │               2 │               1 │               2 │              1 │ reconfiguration │ NewEpochEvent │ {"epoch":"3"} │
// └─────────┴──────────────────┴─────────────────┴─────────────────┴─────────────────┴────────────────┴─────────────────┴───────────────┴───────────────┘

// Math.floor((1701289679612335 - (1701376079939922 - 1701289679612335)) / 1_000 / 1_000)

const V0_TIMESTAMP = 1701203279;

@Controller()
export class OlController {
  private readonly logger = new Logger(OlController.name);

  public constructor(private readonly clickhouseService: ClickhouseService) {}

  @Get('/historical-balance/:address')
  public async historicalBalance(@Param('address') address: string) {

    try {
      // Step 1: Get historical balances directly from coin_balance using version instead of timestamp
      const balanceQuery = `
        SELECT
          "version",
          "balance" / 1e6 AS "value"
        FROM "coin_balance"
        WHERE "address" = reinterpretAsUInt256(reverse(unhex('${address}')))
        AND "coin_module" = 'libra_coin'
        ORDER BY "version" ASC
      `;

      const resultSet = await this.clickhouseService.client.query({
        query: balanceQuery,
        format: 'JSONEachRow',
      });

      const balanceRows = await resultSet.json<{
        version: string;
        value: number;
      }>();

      if (!balanceRows.length) {
        this.logger.log(`No balance data found for address: ${address}`);
        return { timestamp: [], balance: [], unlocked: [], locked: [] };
      }

      // Step 2: Convert versions to timestamps using the separate query
      const versions = balanceRows.map(row => parseInt(row.version, 10));

      const timestampQuery = `
        WITH
          "gen_txs" AS (
            SELECT ("version" + 1) as "version"
            FROM "genesis_transaction"
            WHERE
            "genesis_transaction"."version" IN (${versions.join(',')})
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
            WHERE "version" IN (${versions.join(',')})

            UNION ALL

            SELECT "timestamp", "version"
            FROM "state_checkpoint_transaction"
            WHERE "version" IN (${versions.join(',')})

            UNION ALL

            SELECT "timestamp", "version"
            FROM "user_transaction"
            WHERE "version" IN (${versions.join(',')})

            UNION ALL

            SELECT "timestamp", "version"
            FROM "script"
            WHERE "version" IN (${versions.join(',')})
          )

          SELECT "timestamp", "version"
          FROM "tx_timestamps"
          ORDER BY "version" ASC
      `;

      const timestampResultSet = await this.clickhouseService.client.query({
        query: timestampQuery,
        format: 'JSONEachRow',
      });

      const timestampRows = await timestampResultSet.json<{
        timestamp: string;
        version: string;
      }>();

      // Create a map from version to timestamp for efficient lookup
      const versionToTimestampMap = new Map<number, number>();
      timestampRows.forEach(row => {
        versionToTimestampMap.set(
          parseInt(row.version, 10),
          Math.floor(parseInt(row.timestamp, 10) / 1_000_000) // Convert to seconds
        );
      });

      // Step 3: Query slow wallet data for this address (if any)
      try {
        // Query for the correct slow_wallet table schema
        const slowWalletQuery = `
          SELECT
            "version",
            "unlocked" / 1e6 AS "unlocked"
          FROM "slow_wallet"
          WHERE "address" = reinterpretAsUInt256(reverse(unhex('${address}')))
          ORDER BY "version" ASC
        `;

        const slowWalletResultSet = await this.clickhouseService.client.query({
          query: slowWalletQuery,
          format: 'JSONEachRow',
        });

        const slowWalletRows = await slowWalletResultSet.json<{
          version: string;
          unlocked: number;
        }>();

        // Create maps for version to unlocked value
        const versionToUnlockedMap = new Map<number, number>();

        // Create a map of version to balance for calculating locked amount
        const versionToBalanceMap = new Map<number, number>();
        balanceRows.forEach(row => {
          versionToBalanceMap.set(parseInt(row.version, 10), row.value);
        });

        // Process slow wallet data to get unlocked amounts
        slowWalletRows.forEach(row => {
          const version = parseInt(row.version, 10);
          versionToUnlockedMap.set(version, row.unlocked);
        });

        // Step 4: Format the response in the structure expected by the frontend
        const timestamps: number[] = [];
        const balances: number[] = [];
        const unlocked: number[] = [];
        const locked: number[] = [];

        // Combine all data for each version
        balanceRows.forEach(row => {
          const version = parseInt(row.version, 10);
          let time = versionToTimestampMap.get(version) || V0_TIMESTAMP;
          const balance = row.value;
          const unlockedValue = versionToUnlockedMap.get(version) || 0;

          // Calculate locked as total balance minus unlocked
          // Make sure locked value is never negative
          const lockedValue = Math.max(0, balance - unlockedValue);

          timestamps.push(time);
          balances.push(balance);
          unlocked.push(unlockedValue);
          locked.push(lockedValue);
        });

        const response = {
          timestamp: timestamps,
          balance: balances,
          unlocked: unlocked,
          locked: locked
        };

        return response;
      } catch (error) {
        // If there's an error with slow wallet data, just return regular balance data
        this.logger.error(`Error retrieving slow wallet data: ${error.message}`);

        // Format the response with empty unlocked/locked arrays
        const timestamps: number[] = [];
        const balances: number[] = [];

        balanceRows.forEach(row => {
          const version = parseInt(row.version, 10);
          let time = versionToTimestampMap.get(version) || V0_TIMESTAMP;

          timestamps.push(time);
          balances.push(row.value);
        });

        const response = {
          timestamp: timestamps,
          balance: balances,
          unlocked: new Array(balances.length).fill(0),
          locked: new Array(balances.length).fill(0)
        };

        return response;
      }
    } catch (error) {
      this.logger.error(`Error retrieving historical balance: ${error.message}`);
      return { timestamp: [], balance: [], unlocked: [], locked: [] };
    }
  }
}
