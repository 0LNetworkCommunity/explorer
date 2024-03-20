import { Field, ObjectType } from "@nestjs/graphql";
import BN from "bn.js";
import { Decimal } from "decimal.js";

import { AbstractTransaction } from "./GqlTransaction.js";
import { GqlAbstractTransaction } from "./GqlAbstractTransaction.js";

export interface GqlMovementInput {
  amount: Decimal;
  unlockedAmount: Decimal;
  lockedAmount: Decimal;

  balance: Decimal;
  lockedBalance: Decimal;
  version: BN;
  transaction: AbstractTransaction;
}

@ObjectType("Movement")
export class GqlMovement {
  public constructor(input: GqlMovementInput) {
    this.balance = input.balance;
    this.lockedBalance = input.lockedBalance;

    this.unlockedAmount = input.unlockedAmount;
    this.lockedAmount = input.lockedAmount;
    this.amount = input.amount;

    this.version = input.version;
    this.transaction = input.transaction;
  }

  @Field(() => Decimal)
  public amount: Decimal;

  @Field(() => Decimal)
  public unlockedAmount: Decimal;

  @Field(() => Decimal)
  public lockedAmount: Decimal;

  @Field(() => Decimal)
  public balance: Decimal;

  @Field(() => Decimal)
  public lockedBalance: Decimal;

  @Field(() => BN)
  public version: BN;

  @Field(() => GqlAbstractTransaction)
  public transaction: AbstractTransaction;
}
