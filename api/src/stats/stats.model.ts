import { Field, ObjectType } from '@nestjs/graphql';

export interface TopLiquidAccountInput {
  rank: number;
  address: string;
  name?: string;
  unlocked: number;
  balance: number;
  liquidShare: number;
}

@ObjectType()
export class TopLiquidAccount {
  @Field(() => Number)
  public rank: number;

  @Field(() => String)
  public address: string;

  @Field(() => String, { nullable: true })
  public name?: string;

  @Field(() => Number)
  public unlocked: number;

  @Field(() => Number)
  public balance: number;

  @Field(() => Number)
  public liquidShare: number;

  public constructor(input: TopLiquidAccountInput) {
    this.rank = input.rank;
    this.address = input.address;
    this.name = input.name;
    this.unlocked = input.unlocked;
    this.balance = input.balance;
    this.liquidShare = input.liquidShare;
  }
}
