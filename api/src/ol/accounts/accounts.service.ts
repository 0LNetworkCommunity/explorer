import { Injectable } from "@nestjs/common";
import { ClickhouseService } from "../../clickhouse/clickhouse.service.js";
import { OlService } from "../ol.service.js";
import { communityWallets } from "../community-wallets/community-wallets.js";
import { ApiError } from "aptos";
import { Decimal } from "decimal.js";
import { CoinStoreResource } from "../types.js";
import { GqlSlowWallet } from "../models/slow-wallet.model.js";

@Injectable()
export class AccountsService {
  constructor(
    private readonly clickhouseService: ClickhouseService,
    private readonly olService: OlService,
  ) {}

  public async getTopBalanceAccounts(limit: number): Promise<
    {
      rank: number;
      address: string;
      publicName: string;
      balance: number;
      cumulativeShare: { amount: number; percentage: number };
    }[]
  > {
    try {
      const supplyStats = await this.olService.getSupplyStats();
      const totalSupply = supplyStats.totalSupply;

      const query = `
        SELECT
          ROW_NUMBER() OVER (ORDER BY balance DESC) AS rank,
          address,
          balance
        FROM (
          SELECT
            hex(address) AS address,
            max(balance) / 1e6 AS balance
          FROM coin_balance
          WHERE coin_module = 'libra_coin'
          GROUP BY address
        )
        ORDER BY balance DESC
        LIMIT ${limit}
      `;

      const resultSet = await this.clickhouseService.client.query({
        query: query,
        format: "JSONEachRow",
      });

      const rows: Array<{
        rank: number;
        address: string;
        balance: number;
        publicName: string;
      }> = await resultSet.json();

      let cumulativeBalanceAmount = 0;
      const accountsWithCumulative = rows.map((account) => {
        const name = communityWallets.get(account.address)?.name;
        account.publicName = name ? name : "";
        cumulativeBalanceAmount += account.balance;
        const cumulativeShare = {
          amount: cumulativeBalanceAmount,
          percentage: (cumulativeBalanceAmount / totalSupply) * 100,
        };
        return {
          ...account,
          cumulativeShare,
        };
      });

      return accountsWithCumulative;
    } catch (error) {
      console.error("Error in getTopBalanceAccounts:", error);
      throw error;
    }
  }

  public async getBalance(account: {
    address: Buffer;
  }): Promise<Decimal | null> {
    try {
      const res = await this.olService.aptosClient.getAccountResource(
        `0x${account.address.toString("hex")}`,
        "0x1::coin::CoinStore<0x1::libra_coin::LibraCoin>",
      );
      const balance = new Decimal(
        (res.data as CoinStoreResource).coin.value,
      ).div(1e6);
      return balance;
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.errorCode === "resource_not_found") {
          return null;
        }
      }
      throw error;
    }
  }

  public async getSlowWallet(account: {
    address: Buffer;
  }): Promise<GqlSlowWallet | null> {
    try {
      const res = await this.olService.aptosClient.getAccountResource(
        `0x${account.address.toString("hex")}`,
        "0x1::slow_wallet::SlowWallet",
      );
      const slowWallet = res.data as SlowWalletResource;
      return new GqlSlowWallet({
        unlocked: new Decimal(slowWallet.unlocked).div(1e6),
        transferred: new Decimal(slowWallet.transferred).div(1e6),
      });
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.errorCode === "resource_not_found") {
          return null;
        }
      }
      throw error;
    }
  }
}

export interface SlowWalletResource {
  transferred: string;
  unlocked: string;
}
