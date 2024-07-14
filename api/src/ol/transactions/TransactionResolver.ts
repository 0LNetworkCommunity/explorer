import { Parent, ResolveField, Resolver } from '@nestjs/graphql';
import { Inject } from '@nestjs/common';

import { Transaction } from './Transaction.js';
import { IOnChainTransactionsRepository, ITransaction } from './interfaces.js';
import { Types } from '../../types.js';
import { AbstractTransaction } from '../models/AbstractTransaction.js';

@Resolver(Transaction)
export class TransactionResolver {
  public constructor(
    @Inject(Types.IOnChainTransactionsRepository)
    private readonly onChainTransactionsRepository: IOnChainTransactionsRepository,
  ) {}

  @ResolveField(() => AbstractTransaction, { nullable: true })
  public async onChainTransaction(
    @Parent() transaction: ITransaction,
  ): Promise<AbstractTransaction | null> {
    const transactions = await this.onChainTransactionsRepository.getTransactionsByHashes([
      transaction.hash,
    ]);

    const v = Array.from(transactions.values());
    return v[0] ?? null;
  }
}
