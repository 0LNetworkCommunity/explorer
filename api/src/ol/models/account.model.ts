import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class Account {
  public constructor(address: Buffer) {
    this.address = address;
  }

  @Field(() => Buffer)
  public address: Buffer;
}