import { Injectable } from '@nestjs/common';
import BN from 'bn.js';
import { ClickhouseService } from "../clickhouse/clickhouse.service.js";

@Injectable()
export class OlDbService {
  public constructor(private readonly clichouseService: ClickhouseService) {}

  public async getLastBatchIngestedVersion(): Promise<BN | null> {
    const resultSet = await this.clichouseService.client.query({
      query: `
        WITH "batch_ingested_version" AS
        (
          SELECT
            toUInt64(
              splitByChar(
                '-',
                splitByChar('/', "name")[1]
              )[2]
          ) AS "version"
          FROM "ingested_files"
        )
        SELECT
          "version"
        FROM "batch_ingested_version"
        ORDER BY "version" DESC
        LIMIT 1
      `,
      format: "JSON",
    });

    const res = await resultSet.json<{ version: string }[]>();

    if (!res || res.length === 0) {
        return null;
    }

    return new BN(res[0].version).add(new BN(99));
  }

  public async getIngestedVersions(after?: BN): Promise<BN[]> {
    const resultSet = await this.clichouseService.client.query({
      query: `
        SELECT DISTINCT "version"
        FROM "ingested_versions"
        ${after !== undefined ? `WHERE "version" > ${after.toString()}` : ""}
        ORDER BY "version"
      `,
      format: "JSON",
    });

    const res = await resultSet.json<{ version: string }[]>();

    if (res) {
      return res.map((it) => new BN(it.version));
    } else {
      return [];
    }
  }
}
