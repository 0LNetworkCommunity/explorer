import { InjectQueue, Processor, WorkerHost } from '@nestjs/bullmq';
import _ from 'lodash';
import { Inject, OnModuleInit } from '@nestjs/common';
import { Job, Queue } from 'bullmq';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import BN from 'bn.js';
import { ApiError } from 'aptos';
import { PendingTransactionStatus } from '@prisma/client';

import { OlConfig } from '../../config/config.interface.js';
import { Types } from '../../types.js';
import { ITransactionsService } from './interfaces.js';
import { OlService } from '../ol.service.js';
import { parseHexString } from '../../utils.js';

@Processor('expired-transactions')
export class ExpiredTransactionsProcessor extends WorkerHost implements OnModuleInit {
  private readonly providerHost: string;

  public constructor(
    @InjectQueue('expired-transactions')
    private readonly expiredTransactionsQueue: Queue,

    @Inject(Types.ITransactionsService)
    private readonly transactionsService: ITransactionsService,

    private readonly olService: OlService,

    configService: ConfigService,
  ) {
    super();

    const config = configService.get<OlConfig>('ol')!;
    this.providerHost = config.provider;
  }

  public async onModuleInit() {
    await this.expiredTransactionsQueue.add('findExpiredTransactions', undefined, {
      repeat: {
        every: 5 * 1_000, // 5 seconds
      },
      removeOnComplete: true,
    });
  }

  public async process(job: Job<any, any, string>) {
    switch (job.name) {
      case 'findExpiredTransactions':
        await this.findExpiredTransactions();
        break;

      case 'expireTransaction':
        await this.expireTransaction(new Uint8Array(Buffer.from(job.data.hash, 'hex')));
        break;

      default:
        throw new Error(`invalid job name ${job.name}`);
    }
  }

  private async getLedgerTimestamp(): Promise<BN> {
    const res = await axios({
      method: 'GET',
      url: `${this.providerHost}/v1`,
      signal: AbortSignal.timeout(5 * 60 * 1_000), // 5 minutes
    });

    return new BN(res.data.ledger_timestamp);
  }

  private async expireTransaction(transactionHash: Uint8Array) {
    const transactionHashBuff = Buffer.from(transactionHash);

    try {
      const tx = await this.olService.aptosClient.getTransactionByHash(
        `0x${transactionHashBuff.toString('hex')}`,
      );

      const txHash = parseHexString(tx.hash);
      if (!Buffer.from(txHash).equals(transactionHashBuff)) {
        throw new Error(
          `transaction hash retrieved is different than the one provided provided=${transactionHashBuff.toString('hex')} returned=${Buffer.from(txHash).toString('hex')}`,
        );
      }

      await this.transactionsService.updateTransactionStatus(
        transactionHash,
        undefined,
        PendingTransactionStatus.ON_CHAIN,
      );
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.errorCode === 'transaction_not_found') {
          await this.transactionsService.updateTransactionStatus(
            transactionHash,
            PendingTransactionStatus.UNKNOWN,
            PendingTransactionStatus.EXPIRED,
          );
          return;
        }
      }

      throw error;
    }
  }

  private async findExpiredTransactions() {
    const ledgerTimestamp = await this.getLedgerTimestamp();
    const timestamp = ledgerTimestamp.div(new BN(1e6)).toNumber() + 1;

    const transactionHashes = await this.transactionsService.getTransactionsExpiredAfter(
      timestamp,
      50,
    );

    for (const transactionHash of transactionHashes) {
      const hash = Buffer.from(transactionHash).toString('hex');

      await this.expiredTransactionsQueue.add(
        'expireTransaction',
        { hash },
        {
          jobId: `__transaction__${hash}`,
          attempts: 10,
          backoff: {
            type: 'fixed',
          },
          removeOnComplete: {
            age: 3600, // keep up to 1 hour
          },
        },
      );
    }
  }
}
