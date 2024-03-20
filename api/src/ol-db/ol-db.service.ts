import { Injectable } from '@nestjs/common';
import BN from 'bn.js';
import {
  ClickhouseQueryResponse,
  ClickhouseService,
} from '../clickhouse/clickhouse.service.js';

@Injectable()
export class OlDbService {
  public constructor(private readonly clichouseService: ClickhouseService) {}

  public async getLastBatchIngestedVersion(): Promise<BN | null> {
    const resultSet = await this.clichouseService.client.query({
      query: `
        SELECT
          max(
            toUInt64(
              splitByChar(
                '-',
                splitByChar('/', name)[1]
              )[2]
            )
          ) AS "last_batch_ingested_version"
        FROM "ingested_files"
      `,
      format: "JSON",
    });
    const res =
      await resultSet.json<
        ClickhouseQueryResponse<{ last_batch_ingested_version: string }>
      >();

    if (!res.rows) {
      return null;
    }

    return new BN(res.data[0].last_batch_ingested_version);
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
    const res =
      await resultSet.json<ClickhouseQueryResponse<{ version: string }>>();
    return res.data.map((it) => new BN(it.version));
  }
}
