import { Field, ObjectType, Int, Float } from '@nestjs/graphql';

export interface CumulativeShareInput {
  amount: number;
  percentage: number;
}

@ObjectType()
export class CumulativeShare {
  @Field(() => Float)
  public amount: number;

  @Field(() => Float)
  public percentage: number;

  public constructor(input: CumulativeShareInput) {
    this.amount = input.amount;
    this.percentage = input.percentage;
  }
}

export interface TopAccountInput {
  rank: number;
  address: string;
  publicName: string;
  balance: number;
  cumulativeShare: CumulativeShare;
}

@ObjectType()
export class TopAccount {
  @Field(() => Int)
  public rank: number;

  @Field()
  public address: string;

  @Field()
  public publicName: string;

  @Field(() => Float)
  public balance: number;

  @Field(() => CumulativeShare)
  public cumulativeShare: CumulativeShare;

  public constructor(input: TopAccountInput) {
    this.rank = input.rank;
    this.address = input.address;
    this.publicName = input.publicName;
    this.balance = input.balance;
    this.cumulativeShare = input.cumulativeShare;
  }
}
