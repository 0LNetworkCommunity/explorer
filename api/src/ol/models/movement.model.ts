import { Field, ObjectType } from '@nestjs/graphql';

interface GqlMovementInput {
  balance: number;
  version: number;
}

@ObjectType('Movement')
export class GqlMovement {
  public constructor(input: GqlMovementInput) {
    this.balance = input.balance;
    this.version = input.version;
  }

  @Field(() => Number)
  public balance: number;

  @Field(() => Number)
  public version: number;
}