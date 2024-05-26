import { Inject, Injectable } from "@nestjs/common";
import BN from "bn.js";
import { Decimal } from "decimal.js";

import {
  BlockMetadataTransactionDbEntity,
  GenesisTransactionDbEntity,
  IOnChainTransactionsRepository,
  ITransactionsFactory,
  ScriptUserTransactionDbEntity,
  UserTransactionDbEntity,
} from "./interfaces.js";
import { Types } from "../../types.js";
import { ClickhouseService } from "../../clickhouse/clickhouse.service.js";
import { GqlUserTransaction } from "../models/GqlUserTransaction.js";
import { GqlBlockMetadataTransaction } from "../models/GqlBlockMetadataTransaction.js";
import { GqlScriptUserTransaction } from "../models/GqlScriptUserTransaction.js";
import { GqlGenesisTransaction } from "../models/GqlGenesisTransaction.js";
import { AbstractTransaction } from "../models/GqlTransaction.js";

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
  ): Promise<Map<string, GqlUserTransaction>> {
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
        new GqlUserTransaction({
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
  ): Promise<Map<string, GqlBlockMetadataTransaction>> {
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
          new GqlBlockMetadataTransaction({
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
  ): Promise<Map<string, GqlScriptUserTransaction>> {
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
        new GqlScriptUserTransaction({
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
  ): Promise<Map<string, GqlGenesisTransaction>> {
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
        new GqlGenesisTransaction({
          version: new BN(genesisTransaction.version),
        }),
      ]),
    );
  }

  public async getUserTransactionsByHashes(
    hashes: Uint8Array[],
  ): Promise<Map<string, GqlUserTransaction>> {
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
        new GqlUserTransaction({
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
