import { Injectable } from "@nestjs/common";
import BN from "bn.js";

import {
  BlockMetadataTransactionDbEntity,
  GenesisTransactionDbEntity,
  IOnChainTransactionsRepository,
  ScriptUserTransactionDbEntity,
  UserTransactionDbEntity,
} from "./interfaces.js";
import { ClickhouseService } from "../../clickhouse/clickhouse.service.js";
import { UserTransaction } from "../models/UserTransaction.js";
import { BlockMetadataTransaction } from "../models/BlockMetadataTransaction.js";
import { ScriptUserTransaction } from "../models/ScriptUserTransaction.js";
import { GenesisTransaction } from "../models/GenesisTransaction.js";
import { AbstractTransaction } from "../models/Transaction.js";

@Injectable()
export class OnChainTransactionsRepository
  implements IOnChainTransactionsRepository
{
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
          "arguments"
        FROM "user_transaction"
        WHERE
          "version" IN {versions:Array(UInt64)}
      `,
      query_params: {
        versions,
      },
      format: "JSONEachRow",
    });
    const userTransactionRows =
      await resUserTransaction.json<UserTransactionDbEntity>();

    const userTransactions = new Map(
      userTransactionRows.map((userTransaction) => [
        userTransaction.version,
        new UserTransaction({
          hash: Buffer.from(userTransaction.hash, "hex"),
          sender: Buffer.from(userTransaction.sender, "hex"),
          timestamp: new BN(userTransaction.timestamp),
          version: new BN(userTransaction.version),
          success: userTransaction.success,
          moduleAddress: Buffer.from(userTransaction.module_address, "hex"),
          moduleName: userTransaction.module_name,
          functionName: userTransaction.function_name,
          arguments: userTransaction.arguments,
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

    const blockMetadataTransactionRes =
      await this.clickhouseService.client.query({
        query: `
          SELECT *
          FROM "block_metadata_transaction"
          WHERE
            "version" IN {versions:Array(UInt64)}
        `,
        query_params: {
          versions,
        },
        format: "JSONEachRow",
      });

    const blockMetadataTransactionRows =
      await blockMetadataTransactionRes.json<BlockMetadataTransactionDbEntity>();

    const blockMetadataTransactions = new Map(
      blockMetadataTransactionRows.map((blockMetadataTransaction) => {
        return [
          blockMetadataTransaction.version,
          new BlockMetadataTransaction({
            timestamp: new BN(blockMetadataTransaction.timestamp),
            version: new BN(blockMetadataTransaction.version),
            epoch: new BN(blockMetadataTransaction.epoch),
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
        SELECT *
        FROM "script"
        WHERE
          "version" IN {versions:Array(UInt64)}
      `,
      query_params: {
        versions,
      },
      format: "JSONEachRow",
    });

    const scriptUserTransactionRows =
      await scriptUserTransactionRes.json<ScriptUserTransactionDbEntity>();

    return new Map(
      scriptUserTransactionRows.map((scriptUserTransaction) => [
        scriptUserTransaction.version,
        new ScriptUserTransaction({
          sender: Buffer.from(scriptUserTransaction.sender, "hex"),
          timestamp: new BN(scriptUserTransaction.timestamp),
          version: new BN(scriptUserTransaction.version),
          success: scriptUserTransaction.success,
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
          "version"
        FROM genesis_transaction
        WHERE
          "version" IN {versions:Array(UInt64)}
      `,
      query_params: {
        versions,
      },
      format: "JSONEachRow",
    });

    const genesisTransactionRows =
      await genesisTransactionRes.json<GenesisTransactionDbEntity>();

    return new Map(
      genesisTransactionRows.map((genesisTransaction) => [
        genesisTransaction.version,
        new GenesisTransaction({
          version: new BN(genesisTransaction.version),
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
          "arguments"
        FROM "hashes"
        INNER JOIN
          "user_transaction"
        ON
          "user_transaction"."hash" = "hashes"."hash"
      `,
      query_params: {
        hashes: hashes.map((hash) => Buffer.from(hash).toString("hex")),
      },
      format: "JSONEachRow",
    });

    const userTransactionRows =
      await resUserTransaction.json<UserTransactionDbEntity>();

    const userTransactions = new Map(
      userTransactionRows.map((userTransaction) => [
        Buffer.from(userTransaction.hash, "hex").toString("hex").toUpperCase(),
        new UserTransaction({
          hash: Buffer.from(userTransaction.hash, "hex"),
          sender: Buffer.from(userTransaction.sender, "hex"),
          timestamp: new BN(userTransaction.timestamp),
          version: new BN(userTransaction.version),
          success: userTransaction.success,
          moduleAddress: Buffer.from(userTransaction.module_address, "hex"),
          moduleName: userTransaction.module_name,
          functionName: userTransaction.function_name,
          arguments: userTransaction.arguments,
        }),
      ]),
    );

    return userTransactions;
  }
}
