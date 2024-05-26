import {
  Args,
  Parent,
  Query,
  ResolveField,
  Resolver,
  Int,
} from "@nestjs/graphql";
import { ApiError } from "aptos";
import { Decimal } from "decimal.js";

import { OlService } from "./ol.service.js";
import { GqlAccount } from "./models/account.model.js";
import { GqlSlowWallet } from "./models/slow-wallet.model.js";
import { OrderDirection } from "./models/Paginated.js";
import { PaginatedMovements } from "./models/movements.model.js";
import { MovementsService } from "./movements/movements.service.js";

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
  public constructor(
    private readonly olService: OlService,
    private readonly movementsService: MovementsService,
  ) {}

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
    return this.movementsService.getPaginatedMovements(
      account.address,
      first,
      after,
      order,
    );
  }
}
