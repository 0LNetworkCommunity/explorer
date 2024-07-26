import { Field, ObjectType } from '@nestjs/graphql';

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

  constructor(partial: Partial<CommunityWallet>) {
    Object.assign(this, partial);
  }
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

  constructor(partial: Partial<CommunityWalletStats>) {
    Object.assign(this, partial);
  }
}

@ObjectType()
export class Payment {
  @Field()
  deadline: string;

  @Field()
  payee: string;

  @Field()
  value: number;

  @Field()
  description: string;

  @Field()
  status: string;

  constructor(partial: Partial<Payment>) {
    Object.assign(this, partial);
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

  // also nullable
  // @Field(() => [Number])
  @Field(() => [Number], { nullable: true })
  threshold?: number[];

  @Field()
  totalPaid: number;

  @Field()
  balance: number;

  @Field()
  payees: number;
}
