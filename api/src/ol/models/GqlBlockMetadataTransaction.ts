import { Field, ObjectType } from "@nestjs/graphql";
import BN from "bn.js";

import {
  AbstractTransactionInput,
  GqlAbstractTransaction,
} from "./GqlAbstractTransaction.js";

export type GqlBlockMetadataTransactionInput = AbstractTransactionInput & {
  epoch: BN;
  timestamp: BN;
};

@ObjectType("BlockMetadataTransaction", {
  implements: () => [GqlAbstractTransaction],
})
export class GqlBlockMetadataTransaction implements GqlAbstractTransaction {
  public constructor(input: GqlBlockMetadataTransactionInput) {
    this.timestamp = input.timestamp;
    this.version = input.version;
    this.epoch = input.epoch;
  }

  @Field(() => BN)
  public version: BN;

  @Field(() => BN)
  public epoch: BN;

  @Field(() => BN)
  public timestamp: BN;
}
