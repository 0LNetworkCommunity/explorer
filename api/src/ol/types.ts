import { Types } from "aptos";
import BN from "bn.js";

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

export interface SupplyStats {
  totalSupply: number;
  slowLockedSupply: number;
  cwSupply: number;
  infraEscrowSupply: number;
  circulatingSupply: number;
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
  activeValidators: {
    addr: Buffer;
    config: {
      consensusPubkey: string;
      validatorIndex: BN;
      fullnodeAddresses?: string;
      networkAddresses?: string;
    };
    votingPower: BN;
  }[];
}

export interface ValidatorConfig {
  consensus_pubkey: string;
  fullnode_addresses?: string;
  network_addresses?: string;
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

export interface RawDonorVoiceRegistry {
  liquidation_queue: unknown[];
  list: string[];
}
