import { Field, ObjectType } from '@nestjs/graphql';

interface GqlCommunityWalletInput {
  program: string;
  purpose: string;
  manager: string;
  walletAddress: string;
}

@ObjectType('CommunityWallet')
export class GqlCommunityWallet {
  public constructor(input: GqlCommunityWalletInput) {
    this.program = input.program;
    this.purpose = input.purpose;
    this.manager = input.manager;
    this.walletAddress = input.walletAddress;
  }

  @Field(() => String)
  public program: string;

  @Field(() => String)
  public purpose: string;

  @Field(() => String)
  public manager: string;

  @Field(() => String)
  public walletAddress: string;
}