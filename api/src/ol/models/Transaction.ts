import { createUnionType } from '@nestjs/graphql';

import { BlockMetadataTransaction } from './BlockMetadataTransaction.js';
import { GenesisTransaction } from './GenesisTransaction.js';
import { UserTransaction } from './UserTransaction.js';
import { ScriptUserTransaction } from './ScriptUserTransaction.js';

export type AbstractTransaction =
  | GenesisTransaction
  | BlockMetadataTransaction
  | UserTransaction
  | ScriptUserTransaction;

export const GqlTransaction = createUnionType({
  name: 'ChainTransaction',
  types: () =>
    [GenesisTransaction, BlockMetadataTransaction, UserTransaction, ScriptUserTransaction] as const,
});
