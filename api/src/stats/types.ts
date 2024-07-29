export interface TimestampValue {
  timestamp: number;
  value: number;
}

export interface NameValue {
  name: string;
  value: number;
}

export interface SupplyStats {
  totalSupply: number;
  slowLockedSupply: number;
  cwSupply: number;
  infraEscrowSupply: number;
  circulatingSupply: number;
}

export type BinRange = { name: string; value: number };

export type WalletBalance = { address: string; balance: number };
export type LockedBalance = { address: string; lockedBalance: number };
export type BalanceItem = { balance: number };
export type RelativeValue = { nominal: number; percentage: number };

export interface Stats {
  slowWalletsCountOverTime: TimestampValue[];
  burnOverTime: TimestampValue[];
  accountsOnChainOverTime: TimestampValue[];
  supplyAllocation: NameValue[];
  individualsCapital: NameValue[];
  communityCapital: NameValue[];
  communityWalletsBalanceBreakdown: NameValue[];
  rewardsOverTime: TimestampValue[];
  clearingBidoverTime: TimestampValue[];
  liquidSupplyConcentration: BinRange[];
  lockedSupplyConcentration: {
    accountsLocked: BinRange[];
    avgTotalVestingTime: BinRange[];
  };
  circulatingSupply: RelativeValue;
  totalBurned: RelativeValue;
  communityWalletsBalance: RelativeValue;
  currentSlowWalletsCount: number;
  currentLockedOnSlowWallets: RelativeValue;
  lastEpochTotalUnlockedAmount: RelativeValue;
  lastEpochReward: RelativeValue;
  infrastructureEscrow: RelativeValue;
  currentClearingBid: number;
  lockedCoins: [number, number][];
}
