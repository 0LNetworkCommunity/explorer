import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType('Account')
export class GqlAccount {
  public constructor(address: string) {
    this.address = address;
  }

  @Field(() => String)
  public address: string;
}