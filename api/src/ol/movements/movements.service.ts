import { Inject, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as d3 from "d3-array";
import axios from "axios";
import BN from "bn.js";
import { Decimal } from "decimal.js";

import { NatsService } from "../../nats/nats.service.js";
import { OlConfig } from "../../config/config.interface.js";
import { Movement } from "../models/Movement.js";
import { OrderDirection, PageInfo } from "../models/Paginated.js";
import { PaginatedMovements } from "../models/PaginatedMovements.js";
import { IOnChainTransactionsRepository } from "../transactions/interfaces.js";
import { Types } from "../../types.js";

@Injectable()
export class MovementsService {
  private dataApiHost: string;

  public constructor(
    private readonly natsService: NatsService,
    configService: ConfigService,

    @Inject(Types.IOnChainTransactionsRepository)
    private readonly onChainTransactionsRepository: IOnChainTransactionsRepository,
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
      this.onChainTransactionsRepository.getUserTransactionsByVersions(
        versions,
      ),
      this.onChainTransactionsRepository.getBlockMetadataTransactionsByVersions(
        versions,
      ),
      this.onChainTransactionsRepository.getScriptUserTransactionsByVersions(
        versions,
      ),
      this.onChainTransactionsRepository.getGenesisTransactionsByVersions(
        versions,
      ),
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

      return new Movement({
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
}
