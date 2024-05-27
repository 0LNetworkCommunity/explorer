import { JSONCodec } from "nats";
import { Inject, Injectable } from "@nestjs/common";
import { SignedTransaction } from "@aptos-labs/ts-sdk";

import {
  ITransaction,
  ITransactionsRepository,
  ITransactionsService,
} from "./interfaces.js";
import { Types } from "../../types.js";
import { NatsService } from "../../nats/nats.service.js";
import { getTransactionHash } from "../../utils.js";
import { PendingTransactionStatus } from "@prisma/client";

@Injectable()
export class TransactionsService implements ITransactionsService {
  private static jsonCodec = JSONCodec();

  public constructor(
    private readonly natsService: NatsService,

    @Inject(Types.ITransactionsRepository)
    private readonly transactionsRepository: ITransactionsRepository,
  ) {}

  public async newTransaction(
    signedTransaction: SignedTransaction,
  ): Promise<boolean> {
    if (await this.transactionsRepository.newTransaction(signedTransaction)) {
      const sender = Buffer.from(
        signedTransaction.raw_txn.sender.toUint8Array(),
      )
        .toString("hex")
        .toUpperCase();

      const hash = getTransactionHash(signedTransaction);
      console.log(`PUB wallet.${sender}.transaction`);

      this.natsService.nc.publish(
        `wallet.${sender}.transaction`,
        TransactionsService.jsonCodec.encode({
          hash: Buffer.from(hash).toString("hex").toUpperCase(),
        }),
      );

      return true;
    }
    return false;
  }

  public async getWalletTransactions(
    address: Uint8Array,
  ): Promise<ITransaction[]> {
    return this.transactionsRepository.getWalletTransactions(address);
  }

  public async getTransactionByHash(hash: Uint8Array): Promise<ITransaction> {
    return this.transactionsRepository.getTransactionByHash(hash);
  }

  public async getTransactionsExpiredAfter(
    timestamp: number,
    limit: number,
  ): Promise<Uint8Array[]> {
    return this.transactionsRepository.getTransactionsExpiredAfter(
      timestamp,
      limit,
    );
  }

  public async updateTransactionStatus(
    hash: Uint8Array,
    from: PendingTransactionStatus | undefined,
    to: PendingTransactionStatus,
  ): Promise<void> {
    if (
      await this.transactionsRepository.updateTransactionStatus(hash, from, to)
    ) {
      const transaction = await this.getTransactionByHash(hash);

      const sender = Buffer.from(transaction.sender)
        .toString("hex")
        .toUpperCase();

      console.log(`PUB wallet.${sender}.transaction`);
      this.natsService.nc.publish(
        `wallet.${sender}.transaction`,
        TransactionsService.jsonCodec.encode({
          hash: Buffer.from(transaction.hash).toString("hex").toUpperCase(),
        }),
      );
    }
  }
}

