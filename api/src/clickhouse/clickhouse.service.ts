import pathUtil from "node:path";
import { execFile as execFileNative } from "node:child_process";
import util from "node:util";
import os from "node:os";
import fs from "node:fs";

import {
  Injectable,
  OnApplicationShutdown,
  OnModuleInit,
} from "@nestjs/common";
import { createClient, ClickHouseClient } from "@clickhouse/client";
import { ConfigService } from "@nestjs/config";

import { ClickhouseConfig } from "../config/config.interface.js";

const execFile = util.promisify(execFileNative);

export interface ClickhouseQueryResponse<T> {
  meta: { name: string; type: string }[];
  data: T[];
  rows: number;
  statistics: { elapsed: number; rows_read: number; bytes_read: number };
}

@Injectable()
export class ClickhouseService implements OnModuleInit, OnApplicationShutdown {
  private insertQueriesFiles = new Map<string, string>();

  public readonly client: ClickHouseClient;

  private readonly config: ClickhouseConfig;

  public constructor(config: ConfigService) {
    const clickhouseConfig = config.get<ClickhouseConfig>("clickhouse")!;

    this.config = clickhouseConfig;

    let protocol = "http";
    if (clickhouseConfig.port === 443) {
      protocol = "https";
    }

    const host = `${protocol}://${clickhouseConfig.host}:${clickhouseConfig.httpPort}`;

    this.client = createClient({
      host,
      username: clickhouseConfig.username,
      password: clickhouseConfig.password,
      database: clickhouseConfig.database,
    });
  }

  public async onModuleInit() {
    const dirname = pathUtil.dirname(new URL(import.meta.url).pathname);
    const queriesDir = pathUtil.join(dirname, "queries");
    const files = await fs.promises.readdir(queriesDir);
    for (const file of files) {
      const queryName = file.split(".")[0];
      this.insertQueriesFiles.set(queryName, pathUtil.join(queriesDir, file));
    }
  }

  public onApplicationShutdown() {
    this.client.close();
  }

  public async insertParquetFile(path: string): Promise<void> {
    const queryName = pathUtil.basename(path).split(".")[0];

    const queryPath = this.insertQueriesFiles.get(queryName);
    if (!queryPath) {
      throw new Error(`insert query missing for ${queryName}`);
    }

    const clickhouseConfig = this.config;

    const clickhouseClient =
      os.platform() === "darwin" ? "clickhouse client" : "clickhouse-client";

    await execFile("sh", [
      "-c",
      `cat ${path} |
         ${clickhouseClient} \
         -h "${clickhouseConfig.host}" \
         --port "${clickhouseConfig.port}" \
         -d "${clickhouseConfig.database}" \
         -u "${clickhouseConfig.username}" \
         --password "${clickhouseConfig.password}" \
         --query="$(cat ${queryPath})"
      `,
    ]);
  }
}
