import { Args, Float, Parent, Query, ResolveField, Resolver } from "@nestjs/graphql";
import { OlService } from "./ol.service.js";
import { GqlAccount } from "./models/account.model.js";
import { GqlSlowWallet } from "./models/slow-wallet.model.js";
import { ApiError } from "aptos";

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
  public constructor(private readonly olService: OlService) {}

  @Query(() => GqlAccount)
  public async account(
    @Args({ name: "address", type: () => String }) address: string,
  ): Promise<GqlAccount> {
    return new GqlAccount(address);
  }

  @ResolveField(() => Float)
  public async balance(@Parent() account: GqlAccount): Promise<number> {
    const res = await this.olService.aptosClient.getAccountResource(
      `0x${account.address}`,
      "0x1::coin::CoinStore<0x1::libra_coin::LibraCoin>"
    );
    const balance = parseInt((res.data as CoinStoreResource).coin.value, 10) / 1e6;
    return balance;
  }

  @ResolveField(() => GqlSlowWallet, { nullable: true })
  public async slowWallet(@Parent() account: GqlAccount): Promise<GqlSlowWallet | null> {
    try {
      const res = await this.olService.aptosClient.getAccountResource(
        `0x${account.address}`,
        "0x1::slow_wallet::SlowWallet",
      );
      const slowWallet = res.data as SlowWalletResource;
      return new GqlSlowWallet({
        unlocked: parseInt(slowWallet.unlocked, 10) / 1e6,
        transferred: parseInt(slowWallet.transferred, 10) / 1e6,
      });
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.errorCode === 'resource_not_found') {
          return null;
        }
      }
      throw error;
    }
  }
}