export interface TimestampValue {
  timestamp: number;
  value: number;
}

export interface NameValue {
  name: string;
  value: number;
}

export type BinRange = { name: string; value: number };

export type WalletBalance = { address: string; balance: number };
export type LockedBalance = { address: string; lockedBalance: number };
export type BalanceItem = { balance: number };
export type RelativeValue = { nominal: number; percentage: number }

export interface Stats {
  slowWalletsCountOverTime: TimestampValue[];
  burnOverTime: TimestampValue[];
  accountsOnChainOverTime: TimestampValue[];
  communityWalletsBalanceBreakdown: NameValue[];
  liquidSupplyConcentration: BinRange[];
  lockedSupplyConcentration: {
    accountsLocked: BinRange[];
    avgTotalVestingTime: BinRange[];
  };
  lastEpochTotalUnlockedAmount: RelativeValue;
  supplyAllocation: NameValue[];
  individualsCapital: NameValue[];
  communityCapital: NameValue[];
  rewardsOverTime: TimestampValue[];
  clearingBidoverTime: TimestampValue[];
  circulatingSupply: RelativeValue;
  totalBurned: RelativeValue;
  communityWalletsBalance: RelativeValue;
  currentSlowWalletsCount: number;
  currentLockedOnSlowWallets: RelativeValue;
  lastEpochReward: RelativeValue;
  currentClearingBid: number;
  lockedCoins: [number, number][];
}