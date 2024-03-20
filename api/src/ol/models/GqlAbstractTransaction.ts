import { Field, InterfaceType } from "@nestjs/graphql";
import BN from "bn.js";

export interface AbstractTransactionInput {
  version: BN;
}

@InterfaceType("AbstractTransaction")
export abstract class GqlAbstractTransaction {
  @Field(() => BN)
  version: BN;
}
