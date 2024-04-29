import pathUtil from "node:path";
import fs from "node:fs";

import axios from "axios";
import qs from "qs";
import {
  Injectable,
  OnApplicationShutdown,
  OnModuleInit,
} from "@nestjs/common";
import { createClient, ClickHouseClient } from "@clickhouse/client";
import { ConfigService } from "@nestjs/config";

import { ClickhouseConfig } from "../config/config.interface.js";

export interface ClickhouseQueryResponse<T> {
  meta: { name: string; type: string }[];
  data: T;
  rows: number;
  statistics: { elapsed: number; rows_read: number; bytes_read: number };
}

@Injectable()
export class ClickhouseService implements OnModuleInit, OnApplicationShutdown {
  private insertQueries = new Map<string, string>();

  public readonly client: ClickHouseClient;

  private readonly config: ClickhouseConfig;

  public constructor(config: ConfigService) {
    const clickhouseConfig = config.get<ClickhouseConfig>("clickhouse")!;

    this.config = clickhouseConfig;

    let protocol = "http";
    if (clickhouseConfig.port === 443) {
      protocol = "https";
    }

    const url = `${protocol}://${clickhouseConfig.host}:${clickhouseConfig.port}`;

    this.client = createClient({
      url,
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
      this.insertQueries.set(
        queryName,
        await fs.promises.readFile(pathUtil.join(queriesDir, file), "utf-8"),
      );
    }
  }

  public onApplicationShutdown() {
    this.client.close();
  }

  public async insertParquetFile(path: string): Promise<void> {
    const queryName = pathUtil.basename(path).split(".")[0];
    const query = this.insertQueries.get(queryName);
    if (!query) {
      throw new Error(`insert query missing for ${queryName}`);
    }

    const clickhouseConfig = this.config;

    let protocol = "http";
    if (clickhouseConfig.port === 443) {
      protocol = "https";
    }

    const url = `${protocol}://${clickhouseConfig.host}:${clickhouseConfig.port}/?${qs.stringify(
      {
        database: clickhouseConfig.database,
        query,
      },
    )}`;

    await axios({
      method: "POST",
      url,
      auth: {
        username: clickhouseConfig.username,
        password: clickhouseConfig.password,
      },
      data: fs.createReadStream(path),
    });
  }
}
