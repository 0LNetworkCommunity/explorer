import { Field, ObjectType } from '@nestjs/graphql';

interface GqlModuleInput {
  address: string;
  name: string;
  functions: string[];
}

@ObjectType('Module')
export class GqlModule {
  public constructor(input: GqlModuleInput) {
    this.address = input.address;
    this.name = input.name;
    this.functions = input.functions;
  }

  @Field(() => String)
  public address: string;

  @Field(() => String)
  public name: string;

  @Field(() => [String])
  public functions: string[];
}