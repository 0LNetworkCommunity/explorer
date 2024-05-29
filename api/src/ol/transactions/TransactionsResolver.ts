import { Args, Mutation, Resolver, Query, Subscription } from "@nestjs/graphql";
import { Inject } from "@nestjs/common";
import { Repeater } from "@repeaterjs/repeater";
import { ConfigService } from "@nestjs/config";

import { Types } from "../../types.js";
import { ITransaction, ITransactionsService } from "./interfaces.js";
import { Transaction } from "./Transaction.js";
import { NatsService } from "../../nats/nats.service.js";
import { deserializeSignedTransaction, getTransactionHash, parseHexString } from "../../utils.js";
import { OlConfig } from "../../config/config.interface.js";
import axios from "axios";

@Resolver()
export class TransactionsResolver {
  private readonly providerHost: string;

  public constructor(
    private readonly natsService: NatsService,

    @Inject(Types.ITransactionsService)
    private readonly transactionsService: ITransactionsService,

    configService: ConfigService,
  ) {
    const config = configService.get<OlConfig>("ol")!;
    this.providerHost = config.provider;
  }

  @Query(() => [Transaction], { name: "walletTransactions" })
  public async getWalletTransactions(
    @Args("address", { type: () => Buffer })
    address: Uint8Array,
  ): Promise<ITransaction[]> {
    return this.transactionsService.getWalletTransactions(address);
  }

  @Query(() => Transaction, { name: "transaction" })
  public async getTransaction(
    @Args("hash", { type: () => Buffer })
    hash: Uint8Array,
  ): Promise<ITransaction> {
    return this.transactionsService.getTransactionByHash(hash);
  }

  @Mutation(() => Transaction)
  public async newTransaction(
    @Args("signedTransaction", { type: () => Buffer })
    signedTransaction: Buffer,
  ) {
    const tx = deserializeSignedTransaction(signedTransaction);
    await this.transactionsService.newTransaction(tx);

    const txHash = Buffer.from(getTransactionHash(tx));

    let resHash: Buffer | undefined;

    try {
      const res = await axios<{
        hash: string;
      }>({
        method: "POST",
        url: `${this.providerHost}/v1/transactions`,
        headers: {
          "content-type": "application/x.diem.signed_transaction+bcs",
        },
        data: signedTransaction,
        signal: AbortSignal.timeout(1 * 60 * 1_000), // 1 minutes
      });
      if (res.status === 202) {
        resHash = Buffer.from(parseHexString(res.data.hash));
      } else {
        console.log(res.status);
      }
    } catch (error) {
      console.error(error);
    }

    if (resHash) {
      if (!txHash.equals(resHash)) {
        throw new Error(
          `transaction hash retrieved is different than the one provided provided=${txHash.toString("hex")} returned=${Buffer.from(resHash).toString("hex")}`,
        );
      }
    }

    return this.transactionsService.getTransactionByHash(txHash);
  }

  @Subscription((returns) => Transaction)
  public async walletTransaction(
    @Args({ name: "address", type: () => Buffer })
    address: Buffer,
  ) {
    return new Repeater(async (push, stop) => {
      const sub = this.natsService.nc.subscribe(
        this.natsService.getWalletTransactionChannel(address),
        {
          callback: async (err, msg) => {
            if (err) {
              stop(err);
            } else {
              const { hash } = msg.json<{ hash: string }>();
              const transaction =
                await this.transactionsService.getTransactionByHash(
                  Buffer.from(hash, "hex"),
                );

              push({
                walletTransaction: transaction,
              });
            }
          },
        },
      );

      await stop;

      sub.unsubscribe();
    });
  }
}
