import { Field, ObjectType } from '@nestjs/graphql';
import BN from 'bn.js';

import { AbstractTransactionInput, AbstractTransaction } from './AbstractTransaction.js';

export type ScriptUserTransactionInput = AbstractTransactionInput & {
  sender: Buffer;
  success: boolean;
  timestamp: BN;
};

@ObjectType('ScriptUserTransaction', {
  implements: () => [AbstractTransaction],
})
export class ScriptUserTransaction implements AbstractTransaction {
  @Field(() => BN)
  public version: BN;

  @Field(() => Buffer)
  public hash: Uint8Array;

  @Field(() => BN)
  public timestamp: BN;

  @Field()
  public success: boolean;

  @Field(() => Buffer)
  public sender: Buffer;

  public constructor(input: ScriptUserTransactionInput) {
    this.version = input.version;
    this.hash = input.hash;
    this.sender = input.sender;
    this.timestamp = input.timestamp;
    this.success = input.success;
  }
}
