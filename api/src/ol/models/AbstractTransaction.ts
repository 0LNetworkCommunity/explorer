import { Field, InterfaceType } from "@nestjs/graphql";
import BN from "bn.js";

export interface AbstractTransactionInput {
  version: BN;
  hash: Uint8Array;
}

@InterfaceType("AbstractTransaction")
export abstract class AbstractTransaction {
  @Field(() => BN)
  version: BN;

  @Field(() => Buffer)
  hash: Uint8Array;
}
