import { Inject, Injectable } from "@nestjs/common";
import {
  ITransaction,
  ITransactionsRepository,
  ITransactionsService,
} from "./interfaces.js";
import { Types } from "../../types.js";

@Injectable()
export class TransactionsService implements ITransactionsService {
  public constructor(
    @Inject(Types.ITransactionsRepository)
    private readonly transactionsRepository: ITransactionsRepository,
  ) {}

  public async newTransaction(
    signedTransaction: Uint8Array,
  ): Promise<Uint8Array> {
    return this.transactionsRepository.newTransaction(signedTransaction);
  }

  public async getWalletTransactions(
    address: Uint8Array,
  ): Promise<ITransaction[]> {
    return this.transactionsRepository.getWalletTransactions(address);
  }
}
