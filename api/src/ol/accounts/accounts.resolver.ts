import { Query, Resolver, Args } from "@nestjs/graphql";
import { Inject } from "@nestjs/common";
import { ServiceUnavailableException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

import { CumulativeShare, TopAccount } from "./accounts.model.js";
import { AccountsService } from "./accounts.service.js";
import { redisClient } from "../../redis/redis.service.js";
import { TOP_BALANCE_ACCOUNTS_CACHE_KEY } from "../constants.js";

@Resolver(() => TopAccount)
export class AccountsResolver {
  private readonly cacheEnabled: boolean;

  public constructor(
    @Inject(AccountsService)
    private readonly accountsService: AccountsService,
    config: ConfigService,
  ) {
    this.cacheEnabled = config.get<boolean>("cacheEnabled")!;
  }

  @Query(() => [TopAccount])
  async getTopAccounts(
    @Args("limit", { type: () => Number, defaultValue: 100 }) limit: number,
  ): Promise<TopAccount[]> {
    // Check if caching is enabled and the query is not present
    if (this.cacheEnabled) {
      const cachedAccounts = await redisClient.get(
        TOP_BALANCE_ACCOUNTS_CACHE_KEY,
      );
      if (cachedAccounts) {
        const accounts = JSON.parse(cachedAccounts);
        return accounts.slice(0, limit).map(
          (account: any) =>
            new TopAccount({
              rank: account.rank,
              address: account.address,
              publicName: account.publicName,
              balance: account.balance,
              cumulativeShare: new CumulativeShare(account.cumulativeShare),
            }),
        );
      }
      throw new ServiceUnavailableException("Cache not ready");
    }

    // If cache is not enabled, get data from the service
    const accounts = await this.accountsService.getTopBalanceAccounts(limit);
    return accounts.map(
      (account) =>
        new TopAccount({
          rank: account.rank,
          address: account.address,
          publicName: account.publicName,
          balance: account.balance,
          cumulativeShare: new CumulativeShare(account.cumulativeShare),
        }),
    );
  }
}
