import { Field, ObjectType } from "@nestjs/graphql";
import BN from "bn.js";

import {
  AbstractTransactionInput,
  AbstractTransaction,
} from "./AbstractTransaction.js";

export type GenesisTransactionInput = AbstractTransactionInput;

@ObjectType("GenesisTransaction", {
  implements: () => [AbstractTransaction],
})
export class GenesisTransaction implements AbstractTransaction {
  @Field(() => BN)
  public version: BN;

  @Field(() => Buffer)
  public hash: Uint8Array;

  public constructor(input: GenesisTransactionInput) {
    this.version = input.version;
    this.hash = input.hash;
  }
}
