import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class GqlCommunityWallet {
  @Field()
  rank: number;

  @Field()
  address: string;

  @Field({ nullable: true })
  name?: string;

  @Field({ nullable: true })
  description?: string;

  @Field({ nullable: true })
  balance?: number;

  constructor(partial: Partial<GqlCommunityWallet>) {
    Object.assign(this, partial);
  }
}
