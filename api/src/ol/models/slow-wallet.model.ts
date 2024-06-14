import { Field, ObjectType } from "@nestjs/graphql";
import { Decimal } from "decimal.js";

interface SlowWalletInput {
  transferred: Decimal;
  unlocked: Decimal;
}

@ObjectType()
export class SlowWallet {
  public constructor(input: SlowWalletInput) {
    this.transferred = input.transferred;
    this.unlocked = input.unlocked;
  }

  @Field(() => Decimal)
  public transferred: Decimal;

  @Field(() => Decimal)
  public unlocked: Decimal;
}
