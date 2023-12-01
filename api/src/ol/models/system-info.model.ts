import { Field, ObjectType } from '@nestjs/graphql';

interface SystemInfoInput {
  consensusReward: number;
}

@ObjectType('SystemInfo')
export class GqlSystemInfo {
  public constructor(input: SystemInfoInput) {
    this.consensusReward = input.consensusReward;
  }

  @Field(() => Number)
  public consensusReward: number;
}