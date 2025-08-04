import { Injectable } from '@nestjs/common';
import BN from 'bn.js';

import {
  BlockMetadataTransactionDbEntity,
  GenesisTransactionDbEntity,
  IOnChainTransactionsRepository,
  ScriptUserTransactionDbEntity,
  UserTransactionDbEntity,
} from './interfaces.js';
import { ClickhouseService } from '../../clickhouse/clickhouse.service.js';
import { UserTransaction } from '../models/UserTransaction.js';
import { BlockMetadataTransaction } from '../models/BlockMetadataTransaction.js';
import { ScriptUserTransaction } from '../models/ScriptUserTransaction.js';
import { GenesisTransaction } from '../models/GenesisTransaction.js';
import { AbstractTransaction } from '../models/Transaction.js';

@Injectable()
export class OnChainTransactionsRepository implements IOnChainTransactionsRepository {
  public constructor(private readonly clickhouseService: ClickhouseService) {}

  public async getTransactionsByHashes(
    hashes: Uint8Array[],
  ): Promise<Map<string, AbstractTransaction>> {
    const userTransactions = await this.getUserTransactionsByHashes(hashes);
    return userTransactions;
  }

  public async getUserTransactionsByVersions(
    versions: number[],
  ): Promise<Map<string, UserTransaction>> {
    if (!versions.length) {
      return new Map();
    }

    const resUserTransaction = await this.clickhouseService.client.query({
      query: `
        SELECT
          hex("hash") as "hash",
          hex("sender") as "sender",
          "timestamp",
          "version",
          "success",
          hex("module_address") as "module_address",
          "module_name",
          "function_name",
          "arguments",
          "gas_used",
          "gas_unit_price"
        FROM "user_transaction"
        WHERE
          "version" IN {versions:Array(UInt64)}
      `,
      query_params: {
        versions,
      },
      format: 'JSONEachRow',
    });
    const userTransactionRows = await resUserTransaction.json() as UserTransactionDbEntity[];

    const userTransactions = new Map(
      userTransactionRows.map((userTxRow: UserTransactionDbEntity) => [
        userTxRow.version,
        new UserTransaction({
          hash: new Uint8Array(Buffer.from(userTxRow.hash, 'hex')),
          sender: Buffer.from(userTxRow.sender, 'hex'),
          timestamp: new BN(userTxRow.timestamp),
          version: new BN(userTxRow.version),
          gasUsed: new BN(userTxRow.gas_used),
          gasUnitPrice: new BN(userTxRow.gas_unit_price),
          success: userTxRow.success,
          moduleAddress: Buffer.from(userTxRow.module_address, 'hex'),
          moduleName: userTxRow.module_name,
          functionName: userTxRow.function_name,
          arguments: userTxRow.arguments,
        }),
      ]),
    );

    return userTransactions;
  }

  public async getBlockMetadataTransactionsByVersions(
    versions: number[],
  ): Promise<Map<string, BlockMetadataTransaction>> {
    if (!versions.length) {
      return new Map();
    }

    const blockMetadataTransactionRes = await this.clickhouseService.client.query({
      query: `
          SELECT
            "timestamp",
            "version",
            "epoch",
            hex("hash") as "hash"
          FROM "block_metadata_transaction"
          WHERE
            "version" IN {versions:Array(UInt64)}
        `,
      query_params: {
        versions,
      },
      format: 'JSONEachRow',
    });

    const blockMetadataTransactionRows =
      await blockMetadataTransactionRes.json() as BlockMetadataTransactionDbEntity[];

    const blockMetadataTransactions = new Map(
      blockMetadataTransactionRows.map((blockTxRow: BlockMetadataTransactionDbEntity) => {
        return [
          blockTxRow.version,
          new BlockMetadataTransaction({
            timestamp: new BN(blockTxRow.timestamp),
            version: new BN(blockTxRow.version),
            epoch: new BN(blockTxRow.epoch),
            hash: new Uint8Array(Buffer.from(blockTxRow.hash, 'hex')),
          }),
        ];
      }),
    );

    return blockMetadataTransactions;
  }

  public async getScriptUserTransactionsByVersions(
    versions: number[],
  ): Promise<Map<string, ScriptUserTransaction>> {
    if (!versions.length) {
      return new Map();
    }

    const scriptUserTransactionRes = await this.clickhouseService.client.query({
      query: `
        SELECT
          hex("sender") as "sender",
          "timestamp",
          "version",
          "success",
          hex("hash") as "hash"
        FROM "script"
        WHERE
          "version" IN {versions:Array(UInt64)}
      `,
      query_params: {
        versions,
      },
      format: 'JSONEachRow',
    });

    const scriptUserTransactionRows =
      await scriptUserTransactionRes.json() as ScriptUserTransactionDbEntity[];

    return new Map(
      scriptUserTransactionRows.map((scriptTxRow: ScriptUserTransactionDbEntity) => [
        scriptTxRow.version,
        new ScriptUserTransaction({
          version: new BN(scriptTxRow.version),
          hash: new Uint8Array(Buffer.from(scriptTxRow.hash, 'hex')),
          sender: Buffer.from(scriptTxRow.sender, 'hex'),
          timestamp: new BN(scriptTxRow.timestamp),
          success: scriptTxRow.success,
        }),
      ]),
    );
  }

  public async getGenesisTransactionsByVersions(
    versions: number[],
  ): Promise<Map<string, GenesisTransaction>> {
    if (!versions.length) {
      return new Map();
    }

    const genesisTransactionRes = await this.clickhouseService.client.query({
      query: `
        SELECT
          "version",
          hex("hash") as "hash"
        FROM genesis_transaction
        WHERE
          "version" IN {versions:Array(UInt64)}
      `,
      query_params: {
        versions,
      },
      format: 'JSONEachRow',
    });

    const genesisTransactionRows = await genesisTransactionRes.json() as GenesisTransactionDbEntity[];

    return new Map(
      genesisTransactionRows.map((genesisTxRow: GenesisTransactionDbEntity) => [
        genesisTxRow.version,
        new GenesisTransaction({
          version: new BN(genesisTxRow.version),
          hash: new Uint8Array(Buffer.from(genesisTxRow.hash, 'hex')),
        }),
      ]),
    );
  }

  public async getUserTransactionsByHashes(
    hashes: Uint8Array[],
  ): Promise<Map<string, UserTransaction>> {
    if (!hashes.length) {
      return new Map();
    }

    const resUserTransaction = await this.clickhouseService.client.query({
      query: `
        WITH
          "hashes" AS (
            SELECT
              arrayJoin(
                arrayMap(
                  x -> reinterpretAsUInt256(reverse(unhex(x))),
                  {hashes:Array(String)}
                )
              ) as "hash"
          )

        SELECT
          hex("user_transaction"."hash") as "hash",
          hex("sender") as "sender",
          "timestamp",
          "version",
          "success",
          hex("module_address") as "module_address",
          "module_name",
          "function_name",
          "arguments",
          "gas_used",
          "gas_unit_price"
        FROM "hashes"
        INNER JOIN
          "user_transaction"
        ON
          "user_transaction"."hash" = "hashes"."hash"
      `,
      query_params: {
        hashes: hashes.map((hash) => Buffer.from(hash).toString('hex')),
      },
      format: 'JSONEachRow',
    });

    const userTransactionRows = await resUserTransaction.json() as UserTransactionDbEntity[];

    const userTransactions = new Map(
      userTransactionRows.map((userTxRow: UserTransactionDbEntity) => [
        Buffer.from(userTxRow.hash, 'hex').toString('hex').toUpperCase(),
        new UserTransaction({
          hash: new Uint8Array(Buffer.from(userTxRow.hash, 'hex')),
          sender: Buffer.from(userTxRow.sender, 'hex'),
          timestamp: new BN(userTxRow.timestamp),
          version: new BN(userTxRow.version),
          success: userTxRow.success,
          moduleAddress: Buffer.from(userTxRow.module_address, 'hex'),
          moduleName: userTxRow.module_name,
          functionName: userTxRow.function_name,
          arguments: userTxRow.arguments,
          gasUsed: new BN(userTxRow.gas_used),
          gasUnitPrice: new BN(userTxRow.gas_unit_price),
        }),
      ]),
    );

    return userTransactions;
  }

  public async getTransactionTimestamp(version: BN): Promise<BN | null> {
    const res = await this.clickhouseService.client.query({
      query: `
        WITH "txs" AS (
          (
            SELECT "timestamp"
            FROM "user_transaction"
            WHERE "version" = {version:UInt64}
            ORDER BY "version" DESC
            LIMIT 1
          )

          UNION ALL

          (
            SELECT "timestamp"
            FROM "block_metadata_transaction"
            WHERE "version" = {version:UInt64}
            ORDER BY "version" DESC
            LIMIT 1
          )

          UNION ALL

          (
            SELECT "timestamp"
            FROM "state_checkpoint_transaction"
            WHERE "version" = {version:UInt64}
            ORDER BY "version" DESC
            LIMIT 1
          )

          UNION ALL

          (
            SELECT "timestamp"
            FROM "script"
            WHERE "version" = {version:UInt64}
            ORDER BY "version" DESC
            LIMIT 1
          )
        )

        SELECT MAX("timestamp") AS "timestamp"
        FROM "txs"
      `,
      format: 'JSONEachRow',
      query_params: {
        version: version.toString(10),
      },
    });
    const rows = await res.json() as { timestamp: string }[];

    if (rows.length) {
      return new BN(rows[0].timestamp);
    }

    return null;
  }
}
