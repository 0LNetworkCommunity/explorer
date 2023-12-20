import { Types } from "aptos";

export type NotPendingTransaction =
  | Types.UserTransaction
  | Types.GenesisTransaction
  | Types.BlockMetadataTransaction
  | Types.StateCheckpointTransaction;

export interface ValidatorGrade {
  compliant: boolean;
  proposedBlocks: number;
  failedBlocks: number;
  ratio: number;
}

export interface CurrentBid {
  currentBid: number;
  expirationEpoch: number;
}

export interface ConsensusReward {
  clearingBid: number;
  entryFee: number;
  medianHistory: [number, number];
  medianWinBid: number;
  netReward: number;
  nominalReward: number;
}

export interface ValidatorSet {
  activeValidators:  {
    addr: string;
    config: {
      consensusPubkey: string;
      validatorIndex: number;
      fullnodeAddresses?: string;
      networkAddresses?: string;
    };
    votingPower: number;
  }[];
}

export interface RawValidatorSet {
  active_validators: {
    addr: string;
    config: {
      consensus_pubkey: string;
      fullnode_addresses: string;
      network_addresses: string;
      validator_index: string;
    };
    voting_power: string;
  }[];
}
