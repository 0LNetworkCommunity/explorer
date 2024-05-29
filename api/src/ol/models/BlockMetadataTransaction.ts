import { Field, ObjectType } from "@nestjs/graphql";
import BN from "bn.js";

import {
  AbstractTransactionInput,
  AbstractTransaction,
} from "./AbstractTransaction.js";

export type BlockMetadataTransactionInput = AbstractTransactionInput & {
  epoch: BN;
  timestamp: BN;
};

@ObjectType("BlockMetadataTransaction", {
  implements: () => [AbstractTransaction],
})
export class BlockMetadataTransaction implements AbstractTransaction {
  public constructor(input: BlockMetadataTransactionInput) {
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
