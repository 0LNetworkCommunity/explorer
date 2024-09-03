import { Field, ObjectType } from '@nestjs/graphql';

interface CommunityWalletInput {
  rank: number;
  address: string;
  name?: string;
  description?: string;
  balance: number;
}

@ObjectType()
export class CommunityWallet {
  @Field()
  rank: number;

  @Field()
  address: string;

  @Field({ nullable: true })
  name?: string;

  @Field({ nullable: true })
  description?: string;

  @Field()
  balance: number;

  public constructor(input: CommunityWalletInput) {
    this.rank = input.rank;
    this.address = input.address;
    this.name = input.name;
    this.description = input.description;
    this.balance = input.balance;
  }
}

interface CommunityWalletStatsInput {
  totalBalance: number;
  totalPaid: number;
  totalPending: number;
  totalVetoed: number;
}

@ObjectType()
export class CommunityWalletStats {
  @Field()
  totalBalance: number;

  @Field()
  totalPaid: number;

  @Field()
  totalPending: number;

  @Field()
  totalVetoed: number;

  public constructor(input: CommunityWalletStatsInput) {
    this.totalBalance = input.totalBalance;
    this.totalPaid = input.totalPaid;
    this.totalPending = input.totalPending;
    this.totalVetoed = input.totalVetoed;
  }
}

interface PaymentInput {
  deadline: number;
  payee: string;
  value: number;
  description: string;
  status: string;
}

@ObjectType()
export class Payment {
  @Field()
  deadline: number;

  @Field()
  payee: string;

  @Field()
  value: number;

  @Field()
  description: string;

  @Field()
  status: string;

  public constructor(input: PaymentInput) {
    this.deadline = input.deadline;
    this.payee = input.payee;
    this.value = input.value;
    this.description = input.description;
    this.status = input.status;
  }
}

@ObjectType()
export class CommunityWalletPayments {
  @Field()
  address: string;

  @Field({ nullable: true })
  name?: string;

  @Field(() => [Payment])
  paid: Payment[];

  @Field(() => [Payment])
  pending: Payment[];

  @Field(() => [Payment])
  vetoed: Payment[];
}

@ObjectType()
export class CommunityWalletDetails {
  @Field()
  address: string;

  @Field({ nullable: true })
  name?: string;

  @Field()
  isMultiAction: boolean;

  @Field(() => [Number], { nullable: true })
  threshold?: number[];

  @Field()
  totalPaid: number;

  @Field()
  balance: number;

  @Field()
  payees: number;
}
