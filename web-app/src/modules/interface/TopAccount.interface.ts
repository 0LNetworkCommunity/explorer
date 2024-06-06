export interface ICumulativeShare {
  amount: number;
  percentage: number;
}

export interface ITopAccount {
  rank: number;
  address: string;
  publicName: string;
  balance: number;
  cumulativeShare: ICumulativeShare;
}
