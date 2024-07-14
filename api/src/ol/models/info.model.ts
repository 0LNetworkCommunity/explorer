import { Field, ObjectType } from '@nestjs/graphql';
import BN from 'bn.js';

interface InfoArgs {
  latestStableVersion: BN | null;
  latestStableTimestamp: BN | null;
}

@ObjectType('Info')
export class Info {
  @Field(() => BN, { nullable: true })
  public latestStableVersion: BN | null;

  @Field(() => BN, { nullable: true })
  public latestStableTimestamp: BN | null;

  public constructor(args: InfoArgs) {
    this.latestStableVersion = args.latestStableVersion;
    this.latestStableTimestamp = args.latestStableTimestamp;
  }
}
