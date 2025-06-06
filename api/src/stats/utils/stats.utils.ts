import { Injectable } from '@nestjs/common';
import { ClickhouseService } from '../../clickhouse/clickhouse.service.js';

@Injectable()
export class StatsUtils {
  constructor(private readonly clickhouseService: ClickhouseService) {}

  chunkArray<T>(array: T[], chunkSize: number): T[][] {
    const results: T[][] = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      results.push(array.slice(i, i + chunkSize));
    }
    return results;
  }

  toHexString(decimalString: string): string {
    return BigInt(decimalString).toString(16).toUpperCase();
  }

  getLast15Chars(address: string): string {
    return address.slice(-15).toUpperCase();
  }

  async mapVersionsToTimestamps(
    versions: number[],
  ): Promise<{ version: number; timestamp: number }[]> {
    const versionsString = versions.join(', ');
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
      format: 'JSONEachRow',
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
}
