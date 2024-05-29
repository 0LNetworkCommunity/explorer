import { Field, ObjectType } from "@nestjs/graphql";
import BN from "bn.js";

import {
  AbstractTransactionInput,
  AbstractTransaction,
} from "./AbstractTransaction.js";

export type ScriptUserTransactionInput = AbstractTransactionInput & {
  sender: Buffer;
  success: boolean;
  timestamp: BN;
};

@ObjectType("ScriptUserTransaction", {
  implements: () => [AbstractTransaction],
})
export class ScriptUserTransaction implements AbstractTransaction {
  @Field(() => BN)
  public version: BN;

  @Field(() => BN)
  public timestamp: BN;

  @Field()
  public success: boolean;

  @Field(() => Buffer)
  public sender: Buffer;

  public constructor(input: ScriptUserTransactionInput) {
    this.sender = input.sender;
    this.timestamp = input.timestamp;
    this.version = input.version;
    this.success = input.success;
  }
}
