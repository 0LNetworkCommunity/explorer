import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType('Account')
export class GqlAccount {
  public constructor(address: Buffer) {
    this.address = address;
  }

  @Field(() => Buffer)
  public address: Buffer;
}