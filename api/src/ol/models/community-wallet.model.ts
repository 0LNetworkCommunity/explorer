import { Field, ObjectType } from '@nestjs/graphql';

interface GqlCommunityWalletInput {
  name?: string;
  description?: string;
  address: Buffer;
}

@ObjectType('CommunityWallet')
export class GqlCommunityWallet {
  public constructor(input: GqlCommunityWalletInput) {
    this.name = input.name;
    this.description = input.description;
    this.address = input.address;
  }

  @Field(() => String, { nullable: true })
  public name?: string;

  @Field(() => String, { nullable: true })
  public description?: string;

  @Field(() => Buffer)
  public address: Buffer;
}