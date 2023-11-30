import { Types } from "aptos";

export type NotPendingTransaction =
  | Types.UserTransaction
  | Types.GenesisTransaction
  | Types.BlockMetadataTransaction
  | Types.StateCheckpointTransaction;