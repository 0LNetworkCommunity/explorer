// import util from "node:util";
// import { execFile as execFileNative } from "node:child_process";

import { Injectable, OnApplicationShutdown } from '@nestjs/common';
import { createClient, ClickHouseClient } from "@clickhouse/client";
import { ConfigService } from "@nestjs/config";
import { ClickhouseConfig } from "../config/config.interface.js";

// const execFile = util.promisify(execFileNative);

export interface ClickhouseQueryResponse<T> {
  meta: { name: string; type: string }[];
  data: T[];
  rows: number;
  statistics: { elapsed: number; rows_read: number; bytes_read: number };
}

@Injectable()
export class ClickhouseService implements OnApplicationShutdown {
  public readonly client: ClickHouseClient;

  private readonly config: ClickhouseConfig;

  public constructor(config: ConfigService) {
    const clickhouseConfig = config.get<ClickhouseConfig>('clickhouse')!;

    this.config = clickhouseConfig;

    let protocol = 'http';
    if (clickhouseConfig.port === 443) {
      protocol = 'https';
    }

    const host = `${protocol}://${clickhouseConfig.httpHost}:${clickhouseConfig.port}`;

    this.client = createClient({
      host,
      username: clickhouseConfig.httpUsername,
      password: clickhouseConfig.httpPassword,
      database: clickhouseConfig.database,
    });
  }

  public onApplicationShutdown() {
    this.client.close();
  }

  // public async insertParquetFile(path: string, table: string) {
  //   const clickhouseConfig = this.config;

  //   await execFile('sh', [
  //     '-c',
  //     `cat ${path} |
  //       clickhouse-client \
  //         -h "${clickhouseConfig.httpHost}" \
  //         --port 9000 \
  //         -u "${clickhouseConfig.httpUsername}" \
  //         --password "${clickhouseConfig.httpPassword}" \
  //         --query="INSERT INTO "${clickhouseConfig.database}"."${table}" FORMAT Parquet"
  //     `,
  //   ]);
  // }

  // public exec(query: string) {
  //   return new Promise<void>(async (resolve, reject) => {
  //     const res = await this.client.exec({
  //       query,
  //     });

  //     let resolved = false;

  //     res.stream.on('data', (chunk) => {
  //       console.log('chunk', chunk);
  //     });

  //     res.stream.on('end', () => {
  //       if (!resolved) {
  //         resolved = true;
  //         resolve();
  //       }
  //     });

  //     res.stream.on('error', (error) => {
  //       if (!resolved) {
  //         resolved = true;
  //         reject(error);
  //       }
  //     });
  //   });
  // }
}
