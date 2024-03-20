import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as d3 from "d3-array";
import axios from "axios";
import BN from "bn.js";
import { Decimal } from "decimal.js";

import { ClickhouseService } from "../clickhouse/clickhouse.service.js";
import { NatsService } from "../nats/nats.service.js";
import { OlConfig } from "../config/config.interface.js";
import { GqlBlockMetadataTransaction } from "./models/GqlBlockMetadataTransaction.js";
import { GqlGenesisTransaction } from "./models/GqlGenesisTransaction.js";
import { GqlMovement } from "./models/GqlMovement.js";
import { GqlUserTransaction } from "./models/GqlUserTransaction.js";
import { OrderDirection, PageInfo } from "./models/Paginated.js";
import { PaginatedMovements } from "./models/movements.model.js";
import { GqlScriptUserTransaction } from "./models/GqlScriptUserTransaction.js";

interface GenesisTransactionDbEntity {
  version: string;
}

interface UserTransactionDbEntity {
  sender: string;
  version: string;
  // hash: string;
  // gas_used: string;
  success: boolean;
  // vm_status: string;
  // sequence_number: string;
  // max_gas_amount: string;
  // gas_unit_price: string;
  // expiration_timestamp: string;
  module_address: string;
  module_name: string;
  function_name: string;
  // type_arguments: string;
  arguments: string;
  timestamp: string;
}

interface BlockMetadataTransactionDbEntity {
  id: string;
  hash: string;
  version: string;
  epoch: string;
  timestamp: string;
}

interface ScriptUserTransactionDbEntity {
  version: string;
  hash: string;
  gas_used: string;
  success: boolean;
  vm_status: string;
  sender: string;
  sequence_number: string;
  max_gas_amount: string;
  gas_unit_price: string;
  expiration_timestamp: string;
  type_arguments: string;
  arguments: string;
  abi: string;
  timestamp: string;
}

@Injectable()
export class MovementsService {
  private dataApiHost: string;

  public constructor(
    private readonly clickhouseService: ClickhouseService,
    private readonly natsService: NatsService,
    configService: ConfigService,
  ) {
    const olConfig = configService.get<OlConfig>("ol")!;
    this.dataApiHost = olConfig.dataApiHost;
  }

  public async getPaginatedMovements(
    bAccountAddress: Buffer,

    first: number,

    after: string | undefined,
    order: OrderDirection,
  ): Promise<PaginatedMovements> {
    const lastestStableVersionBn = await this.getLastestStableVersion();
    if (!lastestStableVersionBn) {
      return new PaginatedMovements(0, new PageInfo(false), []);
    }
    const lastestStableVersion = lastestStableVersionBn.toNumber();
    const accountAddress = bAccountAddress.toString("hex").toUpperCase();

    // Retrieve all the wallets movements from the data api
    const historicalData = await axios<{
      timestamp: number[];
      version: number[];
      balance: number[];
      unlocked: number[];
      locked: number[];
    }>({
      method: "GET",
      url: `${this.dataApiHost}/historical-balance/${accountAddress}`,
    });

    {
      /**
       * @todo
       * move this to the data api
       */
      const { timestamp, version, balance, unlocked, locked } =
        historicalData.data;
      let len = timestamp.length;

      if (len > 1) {
        let i = 1;
        while (i < len) {
          if (
            balance[i - 1] === balance[i] &&
            unlocked[i - 1] === unlocked[i] &&
            locked[i - 1] === locked[i]
          ) {
            timestamp.splice(i, 1);
            version.splice(i, 1);
            balance.splice(i, 1);
            unlocked.splice(i, 1);
            locked.splice(i, 1);
            len -= 1;
          } else {
            i += 1;
          }
        }
      }
    }

    const allVersions = historicalData.data.version.filter(
      (v) => v <= lastestStableVersion,
    );
    const allVersionsLength = allVersions.length;
    if (!allVersionsLength) {
      return new PaginatedMovements(0, new PageInfo(false), []);
    }

    let startIndex: number;
    let endIndex: number;
    let prevIndex: number | undefined;

    switch (order) {
      case OrderDirection.ASC:
        {
          startIndex =
            after === undefined
              ? 0
              : d3.bisectRight(allVersions, parseInt(after, 10));
          endIndex = Math.min(allVersionsLength, startIndex + first);

          prevIndex = startIndex - first - 1;
          if (prevIndex < 0 || prevIndex === startIndex) {
            prevIndex = undefined;
          }
        }
        break;

      case OrderDirection.DESC:
        {
          endIndex =
            after === undefined
              ? allVersionsLength
              : d3.bisectLeft(allVersions, parseInt(after, 10));
          startIndex = Math.max(0, endIndex - first);

          prevIndex = endIndex + first;
          if (prevIndex > allVersionsLength - 1 || prevIndex === startIndex) {
            prevIndex = undefined;
          }
        }
        break;
    }

    const versions = allVersions.slice(startIndex, endIndex);

    const [
      userTransactions,
      blockMetadataTransactions,
      scriptUserTransactions,
      genesisTransactions,
    ] = await Promise.all([
      this.getUserTransactions(versions),
      this.getBlockMetadataTransactions(versions),
      this.getScriptUserTransactions(versions),
      this.getGenesisTransactions(versions),
    ]);

    const movements = versions.map((version, index) => {
      const versionStr = `${version}`;
      const transaction =
        genesisTransactions.get(versionStr) ??
        blockMetadataTransactions.get(versionStr) ??
        scriptUserTransactions.get(versionStr) ??
        userTransactions.get(versionStr);

      const pos = startIndex + index;

      const unlockedBalance = new Decimal(
        historicalData.data.unlocked[index + startIndex],
      );
      const lockedBalance = new Decimal(
        historicalData.data.locked[index + startIndex],
      );
      const balance = new Decimal(
        historicalData.data.balance[index + startIndex],
      );

      let unlockedAmount = unlockedBalance;
      let lockedAmount = lockedBalance;
      let amount = balance;

      if (pos > 0) {
        const prevBalance = new Decimal(historicalData.data.balance[pos - 1]);
        const prevLockedBalance = new Decimal(
          historicalData.data.locked[pos - 1],
        );
        const prevUnlockedBalance = new Decimal(
          historicalData.data.unlocked[pos - 1],
        );

        amount = amount.minus(prevBalance);
        lockedAmount = lockedAmount.minus(prevLockedBalance);
        unlockedAmount = unlockedAmount.minus(prevUnlockedBalance);
      }

      return new GqlMovement({
        version: new BN(version),
        transaction: transaction!,
        lockedBalance: lockedBalance.div(1e6),
        balance: balance.div(1e6),
        amount: amount.div(1e6),
        lockedAmount: lockedAmount.div(1e6),
        unlockedAmount: unlockedAmount.div(1e6),
      });
    });

    switch (order) {
      case OrderDirection.ASC:
        return new PaginatedMovements(
          historicalData.data.version.length,
          new PageInfo(
            endIndex !== allVersionsLength,
            prevIndex !== undefined ? `${allVersions[prevIndex]}` : undefined,
          ),
          movements,
        );

      case OrderDirection.DESC:
        movements.reverse();
        return new PaginatedMovements(
          historicalData.data.version.length,
          new PageInfo(
            startIndex !== 0,
            prevIndex !== undefined ? `${allVersions[prevIndex]}` : undefined,
          ),
          movements,
        );
    }
  }

  private async getLastestStableVersion(): Promise<null | BN> {
    const js = this.natsService.jetstream;
    const kv = await js.views.kv("ol");
    const entry = await kv.get("ledger.latestVersion");
    if (!entry) {
      return null;
    }
    return new BN(entry.string());
  }

  private async getUserTransactions(
    versions: number[],
  ): Promise<Map<string, GqlUserTransaction>> {
    if (!versions.length) {
      return new Map();
    }

    const resUserTransaction = await this.clickhouseService.client.query({
      query: `
        SELECT
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
      await resUserTransaction.json<UserTransactionDbEntity[]>();

    const userTransactions = new Map(
      userTransactionRows.map((userTransaction) => [
        userTransaction.version,
        new GqlUserTransaction({
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

  private async getBlockMetadataTransactions(
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
      await blockMetadataTransactionRes.json<
        BlockMetadataTransactionDbEntity[]
      >();

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

  private async getScriptUserTransactions(
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
      await scriptUserTransactionRes.json<ScriptUserTransactionDbEntity[]>();

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

  private async getGenesisTransactions(
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
      await genesisTransactionRes.json<GenesisTransactionDbEntity[]>();

    return new Map(
      genesisTransactionRows.map((genesisTransaction) => [
        genesisTransaction.version,
        new GqlGenesisTransaction({
          version: new BN(genesisTransaction.version),
        }),
      ]),
    );
  }
}
