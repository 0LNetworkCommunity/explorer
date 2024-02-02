export interface SlowWalletOverTime {
  timestamp: number;
  value: number;
}

export interface Stats {
  slowWalletsOverTime: SlowWalletOverTime[];
  totalSupply: number;
  totalSlowWalletLocked: number;
}