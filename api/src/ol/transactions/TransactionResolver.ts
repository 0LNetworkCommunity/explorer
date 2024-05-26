import { Parent, ResolveField, Resolver } from "@nestjs/graphql";
import { Transaction } from "./Transaction.js";
import {
  AbstractTransaction,
  GqlTransaction,
} from "../models/GqlTransaction.js";
import { IOnChainTransactionsRepository, ITransaction } from "./interfaces.js";
import { Inject } from "@nestjs/common";
import { Types } from "../../types.js";
import { GqlAbstractTransaction } from "../models/GqlAbstractTransaction.js";

@Resolver(Transaction)
export class TransactionResolver {
  public constructor(
    @Inject(Types.IOnChainTransactionsRepository)
    private readonly onChainTransactionsRepository: IOnChainTransactionsRepository,
  ) {}

  @ResolveField(() => GqlAbstractTransaction, { nullable: true })
  public async onChainTransaction(
    @Parent() transaction: ITransaction,
  ): Promise<AbstractTransaction | null> {
    const transactions =
      await this.onChainTransactionsRepository.getTransactionsByHashes([
        transaction.hash,
      ]);

    const v = Array.from(transactions.values());
    return v[0] ?? null;
  }
}
