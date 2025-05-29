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

export interface WalletBalance {
  address: string;
  balance: number;
}

export interface LockedBalance {
  address: string;
  lockedBalance: number;
}

export interface BalanceItem {
  balance: number;
}

export interface RelativeValue {
  nominal: number;
  percentage: number;
}

export interface BinRange {
  name: string;
  value: number;
}

export interface WellKnownAddress {
  name: string;
}

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

export interface AccountsStats {
  totalAccounts: number;
  activeAddressesCount: {
    lastDay: number;
    last30Days: number;
    last90Days: number;
  };
}
