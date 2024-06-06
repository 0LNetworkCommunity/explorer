import { Field, ObjectType, Int, Float } from "@nestjs/graphql";

@ObjectType()
class CumulativeShare {
  @Field(() => Float)
  amount: number;

  @Field(() => Float)
  percentage: number;
}

@ObjectType()
export class GqlTopAccount {
  @Field(() => Int)
  rank: number;

  @Field()
  address: string;

  @Field()
  publicName: string;

  @Field(() => Float)
  balance: number;

  @Field(() => CumulativeShare)
  cumulativeShare: CumulativeShare;
}
