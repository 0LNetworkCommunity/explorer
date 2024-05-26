import { Inject, Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { sha3_256 } from "@noble/hashes/sha3";
import {
  Deserializer,
  Serializer,
  SignedTransaction,
  TransactionPayloadEntryFunction,
  TransactionAuthenticatorEd25519,
} from "@aptos-labs/ts-sdk";

import {
  ITransaction,
  ITransactionsFactory,
  ITransactionsRepository,
} from "./interfaces.js";
import { PrismaService } from "../../prisma/prisma.service.js";
import { Types } from "../../types.js";

@Injectable()
export class TransactionsRepository implements ITransactionsRepository {
  public constructor(
    private readonly prisma: PrismaService,

    @Inject(Types.ITransactionsFactory)
    private readonly transactionsFactory: ITransactionsFactory,
  ) {}

  public async newTransaction(
    signedTransactionArg: Uint8Array,
  ): Promise<Uint8Array> {
    const deserializer = new Deserializer(signedTransactionArg);
    const signedTransaction = SignedTransaction.deserialize(deserializer);

    const serializer = new Serializer();
    signedTransaction.serialize(serializer);

    if (
      signedTransaction.raw_txn.payload instanceof
      TransactionPayloadEntryFunction
    ) {
      const txHash = sha3_256
        .create()
        .update(sha3_256.create().update("DIEM::Transaction").digest())
        .update(new Uint8Array([0]))
        .update(serializer.toUint8Array())
        .digest();

      if (
        signedTransaction.authenticator instanceof
        TransactionAuthenticatorEd25519
      ) {
        const entryFunctionPayload = signedTransaction.raw_txn.payload;

        const { entryFunction } = entryFunctionPayload;
        entryFunction.function_name.identifier;

        const toBytea = (input: Uint8Array) => {
          return `\\x${Buffer.from(input).toString("hex")}`;
        };

        await this.prisma.$queryRaw`
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
              `'{${entryFunction.args
                .map((arg) => toBytea(arg.bcsToBytes()))
                .join(",")}}'`,
            )},
            ${[]}
          )
          ON CONFLICT DO NOTHING
        `;

        throw new Error("unsupported transaction authenticator");
      }
      return txHash;
    }

    throw new Error("unsupported transaction payload type");
  }

  public async getWalletTransactions(
    address: Uint8Array,
  ): Promise<ITransaction[]> {
    const rows = await this.prisma.pendingTransaction.findMany({
      where: {
        sender: Buffer.from(address),
      },
    });

    return Promise.all(
      rows.map((row) =>
        this.transactionsFactory.createTransaction({
          hash: row.hash,
          // sender: row.sender,
          status: row.status,
        }),
      ),
    );
  }
}
