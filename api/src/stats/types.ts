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



export interface Stats {
  slowWalletsCountOverTime: TimestampValue[];
  burnOverTime: TimestampValue[];
  accountsOnChainOverTime: TimestampValue[];
  supplyAndCapital: any;
  communityWalletsBalanceBreakdown: NameValue[];
  lastEpochTotalUnlockedAmount: number;
  pofValues: any;
  liquidSupplyConcentration: BinRange[];
  lockedSupplyConcentration: {
    accountsLocked: BinRange[];
    avgTotalVestingTime: BinRange[];
  };
}