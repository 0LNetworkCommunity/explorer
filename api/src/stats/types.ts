export interface TimestampValue {
  timestamp: number;
  value: number;
}

export interface NameValue {
  name: string;
  value: number;
}

export interface Stats {
  slowWalletsCountOverTime: TimestampValue[];
  burnOverTime: TimestampValue[];
  accountsOnChainOverTime: TimestampValue[];
  supplyAndCapital: any;
  communityWalletsBalanceBreakdown: NameValue[];
  lastEpochTotalUnlockedAmount: number;
  pofValues: any;
}