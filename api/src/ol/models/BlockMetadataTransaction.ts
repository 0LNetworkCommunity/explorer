import { Field, ObjectType } from '@nestjs/graphql';
import BN from 'bn.js';

import { AbstractTransactionInput, AbstractTransaction } from './AbstractTransaction.js';

export type BlockMetadataTransactionInput = AbstractTransactionInput & {
  epoch: BN;
  timestamp: BN;
};

@ObjectType('BlockMetadataTransaction', {
  implements: () => [AbstractTransaction],
})
export class BlockMetadataTransaction implements AbstractTransaction {
  public constructor(input: BlockMetadataTransactionInput) {
    this.version = input.version;
    this.hash = input.hash;
    this.timestamp = input.timestamp;
    this.epoch = input.epoch;
  }

  @Field(() => BN)
  public version: BN;

  @Field(() => Buffer)
  public hash: Uint8Array;

  @Field(() => BN)
  public epoch: BN;

  @Field(() => BN)
  public timestamp: BN;
}
