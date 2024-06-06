import { Query, Resolver, Args } from "@nestjs/graphql";
import { Inject } from "@nestjs/common";
import { GqlTopAccount } from "./accounts.model.js";
import { AccountsService } from "./accounts.service.js";
import { redisClient } from "../../redis/redis.service.js";
import { TOP_BALANCE_ACCOUNTS_CACHE_KEY } from "../constants.js";
import { ServiceUnavailableException } from "@nestjs/common";

@Resolver(() => GqlTopAccount)
export class AccountsResolver {
  private readonly cacheEnabled: boolean;

  public constructor(
    @Inject(AccountsService)
    private readonly accountsService: AccountsService,
  ) {
    this.cacheEnabled = process.env.CACHE_ENABLED === "true"; // Verifique se o cache está habilitado
  }

  @Query(() => [GqlTopAccount])
  async getTopAccounts(
    @Args("limit", { type: () => Number, defaultValue: 100 }) limit: number,
  ): Promise<GqlTopAccount[]> {
    // Check if caching is enabled and the query is not present
    if (this.cacheEnabled) {
      const cachedAccounts = await redisClient.get(
        TOP_BALANCE_ACCOUNTS_CACHE_KEY,
      );
      if (cachedAccounts) {
        const accounts = JSON.parse(cachedAccounts);
        return accounts.slice(0, limit).map((account) => ({
          rank: account.rank,
          address: account.address,
          publicName: account.publicName,
          balance: account.balance,
          cumulativeShare: account.cumulativeShare,
        }));
      }
      throw new ServiceUnavailableException("Cache not ready");
    }

    // If cache is not enabled, get data from the service
    const accounts = await this.accountsService.getTopBalanceAccounts(limit);
    return accounts.map((account) => ({
      rank: account.rank,
      address: account.address,
      publicName: account.publicName,
      balance: account.balance,
      cumulativeShare: account.cumulativeShare,
    }));
  }
}
