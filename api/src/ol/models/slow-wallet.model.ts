import { Field, ObjectType } from '@nestjs/graphql';

interface GqlSlowWalletInput {
  transferred: number;
  unlocked: number;
}

@ObjectType('SlowWallet')
export class GqlSlowWallet {
  public constructor(input: GqlSlowWalletInput) {
    this.transferred = input.transferred;
    this.unlocked = input.unlocked;
  }

  @Field(() => Number)
  public transferred: number;

  @Field(() => Number)
  public unlocked: number;
}