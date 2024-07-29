import { Query, Resolver } from '@nestjs/graphql';
import { StatsService } from './stats.service.js';
import { TopLiquidAccount } from './stats.model.js';

@Resolver()
export class StatsResolver {
  public constructor(private readonly statsService: StatsService) {}

  @Query(() => [TopLiquidAccount])
  async getTopLiquidAccounts(): Promise<TopLiquidAccount[]> {
    return this.statsService.getTopUnlockedBalanceWallets();
  }
}
