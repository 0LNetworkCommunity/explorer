import {
  Args,
  Parent,
  Query,
  ResolveField,
  Resolver,
  ObjectType,
  Field,
  registerEnumType,
  Int,
} from "@nestjs/graphql";
import { Type } from "@nestjs/common";
import { ApiError } from "aptos";
import BN from "bn.js";
import { Decimal } from "decimal.js";
import * as d3 from "d3-array";
import axios from "axios";

import { OlService } from "./ol.service.js";
import { GqlAccount } from "./models/account.model.js";
import { GqlSlowWallet } from "./models/slow-wallet.model.js";
import { ClickhouseService } from "../clickhouse/clickhouse.service.js";
import {
  GqlBlockMetadataTransaction,
  GqlGenesisTransaction,
  GqlTransaction,
  GqlMovement,
  GqlUserTransaction,
} from "./models/movement.model.js";
import { ConfigService } from "@nestjs/config";
import { OlConfig } from "../config/config.interface.js";

export enum OrderDirection {
  ASC = "ASC",
  DESC = "DESC",
}

registerEnumType(OrderDirection, { name: "OrderDirection" });

interface IEdgeType<T> {
  cursor: string;
  node: T;
}

interface IPaginatedType<T> {
  edges: IEdgeType<T>[];
  totalCount: number;
  pageInfo: PageInfo;
}

@ObjectType("PageInfo")
class PageInfo {
  @Field((type) => String, { nullable: true })
  public readonly prevCursor?: string;

  @Field((type) => Boolean)
  public readonly hasNextPage: boolean;

  public constructor(hasNextPage: boolean, prevCursor?: string) {
    this.prevCursor = prevCursor;
    this.hasNextPage = hasNextPage;
  }
}

function Paginated<T>(classRef: Type<T>): Type<IPaginatedType<T>> {
  @ObjectType(`${classRef.name}Edge`)
  class EdgeType {
    @Field((type) => String)
    public readonly cursor: string;

    @Field((type) => classRef)
    public readonly node: T;

    public constructor(cursor: string, node: T) {
      this.cursor = cursor;
      this.node = node;
    }
  }

  @ObjectType({ isAbstract: true })
  abstract class PaginatedType implements IPaginatedType<T> {
    @Field((type) => [EdgeType], { nullable: true })
    public readonly edges: EdgeType[];

    @Field((type) => Number)
    public readonly totalCount: number;

    @Field()
    public readonly pageInfo: PageInfo;

    public constructor(
      totalCount: number,
      pageInfo: PageInfo,
      nodes: T[],
      cursorExtractor: (node: T) => string,
    ) {
      this.totalCount = totalCount;
      this.pageInfo = pageInfo;
      this.edges = nodes.map(
        (node) => new EdgeType(cursorExtractor(node), node),
      );
    }
  }
  return PaginatedType as Type<IPaginatedType<T>>;
}

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

@ObjectType()
class PaginatedMovements extends Paginated(GqlMovement) {
  public constructor(
    totalCount: number,
    pageInfo: PageInfo,
    nodes: GqlMovement[],
  ) {
    super(totalCount, pageInfo, nodes, (movement: GqlMovement) =>
      movement.version.toString(10),
    );
  }
}

export interface SlowWalletResource {
  transferred: string;
  unlocked: string;
}

@Resolver(GqlAccount)
export class AccountResolver {
  private dataApiHost: string;

  public constructor(
    private readonly olService: OlService,
    private readonly clickhouseService: ClickhouseService,
    configService: ConfigService,
  ) {
    const olConfig = configService.get<OlConfig>('ol')!;
    this.dataApiHost = olConfig.dataApiHost;
  }

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

  @ResolveField(() => Decimal, { nullable: true })
  public async balance(@Parent() account: GqlAccount): Promise<Decimal | null> {
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

  @ResolveField(() => GqlSlowWallet, { nullable: true })
  public async slowWallet(
    @Parent() account: GqlAccount,
  ): Promise<GqlSlowWallet | null> {
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

  @ResolveField(() => PaginatedMovements)
  public async movements(
    @Parent() account: GqlAccount,

    @Args({
      name: "first",
      type: () => Int,
      defaultValue: 10,
    })
    first: number,

    @Args({
      name: "after",
      type: () => String,
      nullable: true,
    })
    after: string | undefined,

    @Args({
      name: "order",
      type: () => OrderDirection,
      defaultValue: OrderDirection.ASC,
    })
    order: OrderDirection,
  ): Promise<PaginatedMovements> {
    const accountAddress = account.address.toString("hex").toUpperCase();

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

    const allVersions = historicalData.data.version;
    const allVersionsLength = allVersions.length;

    // Empty list
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
            "version" IN {versions:Array(UInt64)}
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

    const movements = versions.map((version, index) => {
      let transaction: typeof GqlTransaction | undefined;
      if (version === 0) {
        transaction = new GqlGenesisTransaction();
      } else {
        const blockMetadataTransaction = blockMetadataTransactions.get(
          `${version}`,
        );
        if (blockMetadataTransaction) {
          transaction = new GqlBlockMetadataTransaction({
            timestamp: new BN(blockMetadataTransaction.timestamp),
            version: new BN(blockMetadataTransaction.version),
            epoch: new BN(blockMetadataTransaction.epoch),
          });
        } else {
          const userTransaction = userTransactions.get(`${version}`);
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
        version: new BN(version),
        balance: new Decimal(
          historicalData.data.balance[index + startIndex],
        ).div(1e6),
        lockedBalance: new Decimal(
          historicalData.data.locked[index + startIndex],
        ).div(1e6),
        transaction: transaction!,
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
}
