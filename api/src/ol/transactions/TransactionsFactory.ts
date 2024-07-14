import { Inject, Injectable } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { ITransaction, ITransactionsFactory, TransactionArgs } from './interfaces.js';
import { Types } from '../../types.js';

@Injectable()
export class TransactionsFactory implements ITransactionsFactory {
  @Inject()
  private readonly moduleRef: ModuleRef;

  public async createTransaction(args: TransactionArgs): Promise<ITransaction> {
    const transaction = await this.moduleRef.resolve<ITransaction>(Types.ITransaction);
    transaction.init(args);
    return transaction;
  }
}
