import { Inject, Injectable } from '@nestjs/common';
import { PendingTransactionStatus, Prisma } from '@prisma/client';
import {
  SignedTransaction,
  TransactionPayloadEntryFunction,
  TransactionAuthenticatorEd25519,
} from '@aptos-labs/ts-sdk';

import {
  IOnChainTransactionsRepository,
  ITransaction,
  ITransactionsFactory,
  ITransactionsRepository,
  TransactionArgs,
} from './interfaces.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { Types } from '../../types.js';
import { getTransactionHash } from '../../utils.js';
import { UserTransaction } from '../models/UserTransaction.js';

@Injectable()
export class TransactionsRepository implements ITransactionsRepository {
  public constructor(
    private readonly prisma: PrismaService,

    @Inject(Types.ITransactionsFactory)
    private readonly transactionsFactory: ITransactionsFactory,

    @Inject(Types.IOnChainTransactionsRepository)
    private readonly onChainTransactionsRepository: IOnChainTransactionsRepository,
  ) {}

  public async newTransaction(signedTransaction: SignedTransaction): Promise<boolean> {
    if (signedTransaction.raw_txn.payload instanceof TransactionPayloadEntryFunction) {
      const txHash = getTransactionHash(signedTransaction);

      if (signedTransaction.authenticator instanceof TransactionAuthenticatorEd25519) {
        const entryFunctionPayload = signedTransaction.raw_txn.payload;

        const { entryFunction } = entryFunctionPayload;
        entryFunction.function_name.identifier;

        const toBytea = (input: Uint8Array) => {
          return `\\x${Buffer.from(input).toString('hex')}`;
        };

        const affectedRows = await this.prisma.$queryRaw<{ hash: Buffer }[]>`
          INSERT INTO "PendingTransaction" (
            "hash", "sender", "sequenceNumber",
            "maxGasAmount", "gasUnitPrice", "expirationTimestampSecs",
            "chainId", "publicKey", "signature", "functionName",
            "moduleAddress", "moduleName", "args",
            "typeArgs"
          ) VALUES (
            ${txHash},
            ${signedTransaction.raw_txn.sender.toUint8Array()},
            ${signedTransaction.raw_txn.sequence_number},
            ${signedTransaction.raw_txn.max_gas_amount},
            ${signedTransaction.raw_txn.gas_unit_price},
            ${signedTransaction.raw_txn.expiration_timestamp_secs},
            ${signedTransaction.raw_txn.chain_id.chainId},
            ${signedTransaction.authenticator.public_key.toUint8Array()},
            ${signedTransaction.authenticator.signature.toUint8Array()},
            ${entryFunction.function_name.identifier},
            ${entryFunction.module_name.address.data},
            ${entryFunction.module_name.name.identifier},
            ${Prisma.raw(
              `'{${entryFunction.args.map((arg) => toBytea(arg.bcsToBytes())).join(',')}}'`,
            )},
            ${[]}
          )
          ON CONFLICT DO NOTHING
          RETURNING "hash"
        `;
        if (affectedRows.length) {
          return true;
        }
        return false;
      } else {
        throw new Error('unsupported transaction authenticator');
      }
    }

    throw new Error('unsupported transaction payload type');
  }

  public async getWalletTransactions(address: Uint8Array): Promise<ITransaction[]> {
    const rows = await this.prisma.pendingTransaction.findMany({
      where: {
        sender: Buffer.from(address),
      },
    });

    return Promise.all(
      rows.map((row) =>
        this.transactionsFactory.createTransaction({
          hash: row.hash,
          sender: row.sender,
          status: row.status,
        }),
      ),
    );
  }

  public async getTransactionByHash(hash: Uint8Array): Promise<ITransaction> {
    let args: TransactionArgs | undefined;

    const transaction = await this.prisma.pendingTransaction.findFirst({
      where: {
        hash: Buffer.from(hash),
      },
    });
    if (transaction) {
      args = {
        hash: transaction.hash,
        sender: transaction.sender,
        status: transaction.status,
      };
    } else {
      const onChainTransactions = await this.onChainTransactionsRepository.getTransactionsByHashes([
        hash,
      ]);
      const onChainTransaction = onChainTransactions.get(
        Buffer.from(hash).toString('hex').toUpperCase(),
      );
      if (onChainTransaction) {
        if (onChainTransaction instanceof UserTransaction) {
          args = {
            hash: onChainTransaction.hash,
            sender: onChainTransaction.sender,
            status: PendingTransactionStatus.ON_CHAIN,
          };
        }
      }
    }

    if (!args) {
      throw new Error('transaction not found');
    }

    return this.transactionsFactory.createTransaction(args);
  }

  public async getTransactionsExpiredAfter(
    timestamp: number,
    limit: number,
  ): Promise<Uint8Array[]> {
    const transactions = await this.prisma.pendingTransaction.findMany({
      select: {
        hash: true,
      },
      where: {
        expirationTimestampSecs: { lt: timestamp },
        status: PendingTransactionStatus.UNKNOWN,
      },
      take: limit,
      orderBy: {
        expirationTimestampSecs: 'asc',
      },
    });
    return transactions.map((tx) => tx.hash);
  }

  public async updateTransactionStatus(
    hash: Uint8Array,
    from: PendingTransactionStatus | undefined,
    to: PendingTransactionStatus,
  ): Promise<boolean> {
    if (from !== undefined) {
      const hashes = await this.prisma.$queryRaw<{ hash: Buffer }[]>`
        UPDATE "PendingTransaction"
        SET "status" = (${to})::"PendingTransactionStatus"
        WHERE
          "hash" = ${Prisma.raw(`'\\x${Buffer.from(hash).toString('hex')}'`)}
        AND
          "status" = (${from})::"PendingTransactionStatus"
        RETURNING "hash"
      `;
      return hashes.length > 0;
    }

    const hashes = await this.prisma.$queryRaw<{ hash: Buffer }[]>`
      UPDATE "PendingTransaction"
      SET "status" = (${to})::"PendingTransactionStatus"
      WHERE
        "hash" = ${Prisma.raw(`'\\x${Buffer.from(hash).toString('hex')}'`)}
      AND
        "status" != (${to})::"PendingTransactionStatus"
      RETURNING "hash"
    `;
    return hashes.length > 0;
  }
}
