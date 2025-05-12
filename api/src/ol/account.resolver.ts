import { Args, Parent, Query, ResolveField, Resolver, Int } from '@nestjs/graphql';
import { Decimal } from 'decimal.js';

import { OlService } from './ol.service.js';
import { Account } from './models/account.model.js';
import { SlowWallet } from './models/slow-wallet.model.js';
import { OrderDirection } from './models/Paginated.js';
import { PaginatedMovements } from './models/PaginatedMovements.js';
import { MovementsService } from './movements/movements.service.js';

@Resolver(Account)
export class AccountResolver {
  public constructor(
    private readonly olService: OlService,
    private readonly movementsService: MovementsService,
  ) {}

  @Query(() => Account, { nullable: true })
  public async account(
    @Args({ name: 'address', type: () => Buffer }) address: Buffer,
  ): Promise<Account | null> {
    const accountExists = await this.olService.accountExists(address);
    if (accountExists) {
      return new Account(address);
    }
    return null;
  }

  @ResolveField(() => Decimal, { nullable: true })
  public async balance(@Parent() account: Account): Promise<Decimal | null> {
    return this.olService.getAccountBalance(account.address);
  }

  @ResolveField(() => SlowWallet, { nullable: true })
  public async slowWallet(@Parent() account: Account): Promise<SlowWallet | null> {
    return this.olService.getSlowWallet(account.address);
  }

  @ResolveField(() => Boolean, { nullable: true })
  public async initialized(@Parent() account: Account): Promise<Boolean | null> {
    return this.olService.getInitialized(account.address);
  }

  @ResolveField(() => PaginatedMovements)
  public async movements(
    @Parent() account: Account,

    @Args({
      name: 'first',
      type: () => Int,
      defaultValue: 10,
    })
    first: number,

    @Args({
      name: 'after',
      type: () => String,
      nullable: true,
    })
    after: string | undefined,

    @Args({
      name: 'order',
      type: () => OrderDirection,
      defaultValue: OrderDirection.ASC,
    })
    order: OrderDirection,
  ): Promise<PaginatedMovements> {
    return this.movementsService.getPaginatedMovements(account.address, first, after, order);
  }
}
