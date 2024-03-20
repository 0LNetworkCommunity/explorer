import { Field, ObjectType } from "@nestjs/graphql";
import BN from "bn.js";

import {
  AbstractTransactionInput,
  GqlAbstractTransaction,
} from "./GqlAbstractTransaction.js";

export type GqlGenesisTransactionInput = AbstractTransactionInput;

@ObjectType("GenesisTransaction", {
  implements: () => [GqlAbstractTransaction],
})
export class GqlGenesisTransaction implements GqlAbstractTransaction {
  @Field(() => BN)
  public version: BN;

  public constructor(input: GqlGenesisTransactionInput) {
    this.version = input.version;
  }
}
