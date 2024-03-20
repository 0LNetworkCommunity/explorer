import { Args, Parent, Query, ResolveField, Resolver } from "@nestjs/graphql";
import { OlService } from "./ol.service.js";
import { GqlAccount } from "./models/account.model.js";
import { GqlSlowWallet } from "./models/slow-wallet.model.js";
import { ApiError } from "aptos";
import { ClickhouseService } from "../clickhouse/clickhouse.service.js";
import { Inject } from "@nestjs/common";
import { GqlBlockMetadataTransaction, GqlGenesisTransaction, GqlTransaction, GqlMovement, GqlUserTransaction } from "./models/movement.model.js";
import BN from "bn.js";
import { Decimal } from "decimal.js";
import { BytesScalar } from "../graphql/bytes.scalar.js";


export interface CoinStoreResource {
  coin: {
    value: string;
  };
  deposit_events: {
    counter: string;
    guid: {
      id: {
        addr: string;
        creation_num: string;
      };
    };
  };
  withdraw_events: {
    counter: string;
    guid: {
      id: {
        addr: string;
        creation_num: string;
      };
    };
  };
}

export interface SlowWalletResource {
  transferred: string;
  unlocked: string;
}

@Resolver(GqlAccount)
export class AccountResolver {
  @Inject()
  private readonly olService: OlService;

  @Inject()
  private readonly clickhouseService: ClickhouseService;

  @Query(() => GqlAccount, { nullable: true })
  public async account(
    @Args({ name: "address", type: () => Buffer }) address: Buffer,
  ): Promise<GqlAccount | null> {
    const accountExists = await this.olService.accountExists(address);
    if (accountExists) {
      return new GqlAccount(address);
    }
    return null;
  }

  @ResolveField(() => Decimal)
  public async balance(@Parent() account: GqlAccount): Promise<Decimal> {
    const res = await this.olService.aptosClient.getAccountResource(
      `0x${account.address.toString('hex')}`,
      "0x1::coin::CoinStore<0x1::libra_coin::LibraCoin>",
    );
    const balance =
      new Decimal((res.data as CoinStoreResource).coin.value).div(1e6);
    return balance;
  }

  @ResolveField(() => GqlSlowWallet, { nullable: true })
  public async slowWallet(
    @Parent() account: GqlAccount,
  ): Promise<GqlSlowWallet | null> {
    try {
      const res = await this.olService.aptosClient.getAccountResource(
        `0x${account.address.toString('hex')}`,
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

  @ResolveField(() => [GqlMovement])
  public async movements(
    @Parent() account: GqlAccount,
  ): Promise<GqlMovement[]> {
    const balancesRes = await this.clickhouseService.client.query({
      query: `
        SELECT
          "version", "balance"
        FROM "coin_balance"
        WHERE
          "address" = reinterpretAsUInt256(reverse(unhex({address:String})))
        ORDER BY
          "version" DESC, "change_index" DESC
      `,
      query_params: {
        address: account.address.toString('hex'),
      },
      format: "JSONEachRow",
    });

    const balancesRows = await balancesRes.json<
      {
        version: string;
        balance: string;
      }[]
    >();

    const versions = balancesRows.map((row) => row.version);

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
          "version" IN {versions:Array(String)}
      `,
      query_params: {
        versions,
      },
      format: "JSONEachRow",
    });
    const userTransactionRows = await resUserTransaction.json<
      {
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
      }[]
    >();

    const userTransactions = new Map(
      userTransactionRows.map((userTransaction) => [
        userTransaction.version,
        userTransaction,
      ]),
    );

    const blockMetadataTransactionRes =
      await this.clickhouseService.client.query({
        query: `
        SELECT *
        FROM "block_metadata_transaction"
        WHERE
          "version" IN {versions:Array(String)}
      `,
        query_params: {
          versions,
        },
        format: "JSONEachRow",
      });

    const blockMetadataTransactionRows = await blockMetadataTransactionRes.json<
      {
        id: string;
        hash: string;
        version: string;
        epoch: string;
        timestamp: string;
      }[]
    >();

    const blockMetadataTransactions = new Map(
      blockMetadataTransactionRows.map((row) => {
        return [row.version, row];
      }),
    );

    const transactions = balancesRows.map((row) => {
      let transaction: typeof GqlTransaction | undefined;
      if (row.version === "0") {
        transaction = new GqlGenesisTransaction();
      } else {
        const blockMetadataTransaction = blockMetadataTransactions.get(
          row.version,
        );
        if (blockMetadataTransaction) {
          transaction = new GqlBlockMetadataTransaction({
            timestamp: new BN(blockMetadataTransaction.timestamp),
            version: new BN(blockMetadataTransaction.version),
            epoch: new BN(blockMetadataTransaction.epoch),
          });
        } else {
          const userTransaction = userTransactions.get(row.version);
          if (userTransaction) {
            transaction = new GqlUserTransaction({
              sender: Buffer.from(userTransaction.sender, "hex"),
              timestamp: new BN(userTransaction.timestamp),
              version: new BN(userTransaction.version),
              success: userTransaction.success,
              moduleAddress: Buffer.from(userTransaction.module_address, "hex"),
              moduleName: userTransaction.module_name,
              functionName: userTransaction.function_name,
              arguments: userTransaction.arguments,
            });
          }
        }
      }

      return new GqlMovement({
        version: new BN(row.version),
        balance: new Decimal(row.balance).div(1e6),
        transaction: transaction!,
      });
    });

    transactions.sort((a, b) => {
      if (a.version.lt(b.version)) {
        return 1;
      }
      if (a.version.gt(b.version)) {
        return -1;
      }
      return 0;
    });

    return transactions;
  }
}
