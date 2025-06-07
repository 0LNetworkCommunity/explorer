import pathUtil from 'node:path';
import fs from 'node:fs';

import axios from 'axios';
import qs from 'qs';
import { Injectable, OnApplicationShutdown, OnModuleInit, Logger } from '@nestjs/common';
import { createClient, ClickHouseClient, DataFormat } from '@clickhouse/client';
import { ConfigService } from '@nestjs/config';

import { ClickhouseConfig } from '../config/config.interface.js';

export interface ClickhouseQueryResponse<T> {
  meta: { name: string; type: string }[];
  data: T;
  rows: number;
  statistics: { elapsed: number; rows_read: number; bytes_read: number };
}

// Version 0's timestamp is calculated by subtracting the interval between epoch 2 and 3 from epoch 2's timestamp
const V0_TIMESTAMP = 1701203279;

@Injectable()
export class ClickhouseService implements OnModuleInit, OnApplicationShutdown {
  private insertQueries = new Map<string, string>();
  private readonly logger = new Logger(ClickhouseService.name);

  public readonly client: ClickHouseClient;

  private readonly config: ClickhouseConfig;

  public constructor(config: ConfigService) {
    const clickhouseConfig = config.get<ClickhouseConfig>('clickhouse')!;

    this.config = clickhouseConfig;

    let protocol = 'http';
    if (clickhouseConfig.port === 443) {
      protocol = 'https';
    }

    // Use hostname without port for the URL
    const url = `${protocol}://${clickhouseConfig.host}:${clickhouseConfig.port}`;

    this.logger.log(`Connecting to Clickhouse at ${url}`);

    this.client = createClient({
      url,
      username: clickhouseConfig.username,
      password: clickhouseConfig.password,
      database: clickhouseConfig.database,
      request_timeout: 60000, // 60 seconds timeout
      compression: {
        request: false,
        response: false,
      },
      clickhouse_settings: {
        wait_end_of_query: 1,
        connect_timeout: 10,
        receive_timeout: 30,
        send_timeout: 30,
      }
    });
  }

  public async onModuleInit() {
    // Test connection at startup
    try {
      const resultSet = await this.client.query({
        query: 'SHOW DATABASES',
        format: 'JSONEachRow'
      });
      this.logger.log(`Successfully connected to Clickhouse`);
    } catch (error) {
      this.logger.error(`Failed to connect to Clickhouse: ${error.message}`);
    }

    // Load insert queries
    try {
      const dirname = pathUtil.dirname(new URL(import.meta.url).pathname);
      const queriesDir = pathUtil.join(dirname, 'queries');
      const files = await fs.promises.readdir(queriesDir);
      for (const file of files) {
        const queryName = file.split('.')[0];
        this.insertQueries.set(
          queryName,
          await fs.promises.readFile(pathUtil.join(queriesDir, file), 'utf-8'),
        );
      }
    } catch (error) {
      this.logger.error(`Failed to load insert queries: ${error.message}`);
    }
  }

  public onApplicationShutdown() {
    this.client.close();
  }

  // wrapper method for executing queries that adds the database prefix
  public async executeQuery<T>(query: string, format: DataFormat = 'JSONEachRow'): Promise<T[]> {
    // Replace table references without a database prefix
    const modifiedQuery = query.replace(
      /FROM\s+"?([a-zA-Z_][a-zA-Z0-9_]*)"?(?!\.[a-zA-Z_])/g,
      `FROM "${this.config.database || 'default'}".$1`
    );

    this.logger.debug(`Executing query: ${modifiedQuery}`);

    const resultSet = await this.client.query({
      query: modifiedQuery,
      format
    });

    const result = await resultSet.json<T>();
    // Handle both array and object responses
    return Array.isArray(result) ? result : [result as T];
  }

  public async insertParquetFile(path: string): Promise<void> {
    const queryName = pathUtil.basename(path).split('.')[0];
    const startTime = Date.now();

    const query = this.insertQueries.get(queryName);
    if (!query) {
      this.logger.error(`Insert query missing for ${queryName}`);
      throw new Error(`insert query missing for ${queryName}`);
    }

    const clickhouseConfig = this.config;

    let protocol = 'http';
    if (clickhouseConfig.port === 443) {
      protocol = 'https';
    }

    const url = `${protocol}://${clickhouseConfig.host}:${clickhouseConfig.port}/?${qs.stringify({
      database: clickhouseConfig.database,
      query,
    })}`;

    try {
      await axios({
        method: 'POST',
        url,
        auth: {
          username: clickhouseConfig.username,
          password: clickhouseConfig.password,
        },
        data: fs.createReadStream(path),
      });
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error(`Failed to insert parquet file ${queryName} after ${duration}ms: ${error.message}`);
      throw error;
    }
  }

  /**
   * Convert transaction versions to timestamps using the same method as ol.controller.ts
   * @param versions Array of transaction versions to convert
   * @returns Mapping of versions to timestamps (in seconds)
   */
  public async convertVersionsToTimestamps(versions: number[]): Promise<Map<number, number>> {
    if (!versions || versions.length === 0) {
      return new Map();
    }

    try {
      // Using the same query approach as in ol.controller.ts
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

      const resultSet = await this.client.query({
        query: timestampQuery,
        format: 'JSONEachRow',
      });

      const rows = await resultSet.json<{
        timestamp: string;
        version: string;
      }>();

      // Create a map of version to timestamp (converted to seconds)
      const versionToTimestampMap = new Map<number, number>();

      rows.forEach(row => {
        const version = parseInt(row.version, 10);
        // Convert from microseconds to seconds
        const timestamp = Math.floor(parseInt(row.timestamp, 10) / 1_000_000);
        versionToTimestampMap.set(version, timestamp);
      });

      // Handle version 0 with hardcoded timestamp if needed
      if (versions.includes(0) && !versionToTimestampMap.has(0)) {
        versionToTimestampMap.set(0, V0_TIMESTAMP);
      }

      return versionToTimestampMap;
    } catch (error) {
      this.logger.error(`Error converting versions to timestamps: ${error.message}`);
      throw error;
    }
  }
}
