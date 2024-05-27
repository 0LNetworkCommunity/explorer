import { Field, ObjectType, registerEnumType } from "@nestjs/graphql";
import { PendingTransactionStatus } from "@prisma/client";

import { ITransaction, TransactionArgs } from "./interfaces.js";

registerEnumType(PendingTransactionStatus, {
  name: "TransactionStatus",
});

@ObjectType("Transaction")
export class Transaction implements ITransaction {
  @Field(() => Buffer)
  public hash: Uint8Array;

  @Field(() => Buffer)
  public sender: Uint8Array;

  @Field(() => PendingTransactionStatus)
  public status: PendingTransactionStatus;

  public init(args: TransactionArgs) {
    this.hash = args.hash;
    this.sender = args.sender;
    this.status = args.status;
  }
}
