import { JSONCodec } from 'nats';
import { Inject, Injectable } from '@nestjs/common';
import { SignedTransaction } from '@aptos-labs/ts-sdk';
import { PendingTransactionStatus } from '@prisma/client';

import { ITransaction, ITransactionsRepository, ITransactionsService } from './interfaces.js';
import { Types } from '../../types.js';
import { NatsService } from '../../nats/nats.service.js';
import { getTransactionHash } from '../../utils.js';

@Injectable()
export class TransactionsService implements ITransactionsService {
  private static jsonCodec = JSONCodec();

  public constructor(
    private readonly natsService: NatsService,

    @Inject(Types.ITransactionsRepository)
    private readonly transactionsRepository: ITransactionsRepository,
  ) {}

  public async newTransaction(signedTransaction: SignedTransaction): Promise<boolean> {
    if (await this.transactionsRepository.newTransaction(signedTransaction)) {
      const hash = getTransactionHash(signedTransaction);

      this.natsService.nc.publish(
        this.natsService.getWalletTransactionChannel(
          signedTransaction.raw_txn.sender.toUint8Array(),
        ),
        TransactionsService.jsonCodec.encode({
          hash: Buffer.from(hash).toString('hex').toUpperCase(),
        }),
      );

      return true;
    }
    return false;
  }

  public async getWalletTransactions(address: Uint8Array): Promise<ITransaction[]> {
    return this.transactionsRepository.getWalletTransactions(address);
  }

  public async getTransactionByHash(hash: Uint8Array): Promise<ITransaction> {
    return this.transactionsRepository.getTransactionByHash(hash);
  }

  public async getTransactionsExpiredAfter(
    timestamp: number,
    limit: number,
  ): Promise<Uint8Array[]> {
    return this.transactionsRepository.getTransactionsExpiredAfter(timestamp, limit);
  }

  public async updateTransactionStatus(
    hash: Uint8Array,
    from: PendingTransactionStatus | undefined,
    to: PendingTransactionStatus,
  ): Promise<boolean> {
    if (await this.transactionsRepository.updateTransactionStatus(hash, from, to)) {
      const transaction = await this.getTransactionByHash(hash);
      this.natsService.nc.publish(
        this.natsService.getWalletTransactionChannel(transaction.sender),
        TransactionsService.jsonCodec.encode({
          hash: Buffer.from(transaction.hash).toString('hex').toUpperCase(),
        }),
      );
      return true;
    }
    return false;
  }
}
