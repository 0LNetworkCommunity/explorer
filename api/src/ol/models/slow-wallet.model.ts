import { Field, ObjectType } from '@nestjs/graphql';
import { Decimal } from 'decimal.js';

interface GqlSlowWalletInput {
  transferred: Decimal;
  unlocked: Decimal;
}

@ObjectType('SlowWallet')
export class GqlSlowWallet {
  public constructor(input: GqlSlowWalletInput) {
    this.transferred = input.transferred;
    this.unlocked = input.unlocked;
  }

  @Field(() => Decimal)
  public transferred: Decimal;

  @Field(() => Decimal)
  public unlocked: Decimal;
}