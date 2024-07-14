import { Field, ObjectType } from '@nestjs/graphql';
import BN from 'bn.js';

import { AbstractTransactionInput, AbstractTransaction } from './AbstractTransaction.js';

export type UserTransactionInput = AbstractTransactionInput & {
  sender: Buffer;
  success: boolean;
  moduleAddress: Buffer;
  moduleName: string;
  functionName: string;
  arguments: string;
  timestamp: BN;
};

@ObjectType('UserTransaction', {
  implements: () => [AbstractTransaction],
})
export class UserTransaction implements AbstractTransaction {
  @Field(() => Buffer)
  public hash: Uint8Array;

  @Field(() => BN)
  public version: BN;

  @Field(() => BN)
  public timestamp: BN;

  @Field()
  public success: boolean;

  @Field(() => Buffer)
  public sender: Buffer;

  @Field(() => Buffer)
  public moduleAddress: Buffer;

  @Field(() => String)
  public moduleName: string;

  @Field(() => String)
  public functionName: string;

  @Field(() => String)
  public arguments: string;

  public constructor(input: UserTransactionInput) {
    this.hash = input.hash;
    this.sender = input.sender;
    this.timestamp = input.timestamp;
    this.version = input.version;
    this.success = input.success;
    this.moduleAddress = input.moduleAddress;
    this.moduleName = input.moduleName;
    this.functionName = input.functionName;
    this.arguments = input.arguments;
    this.timestamp = input.timestamp;
  }
}
