export interface IValidator {
  address: string;
  inSet: boolean;
  index: number;
  votingPower: number;
  account: {
    balance: string;
    slowWallet: {
      unlocked: string;
    } | null;
  };
  vouches: {
    epoch: number;
  }[];
  grade: {
    compliant: boolean;
    failedBlocks: number;
    proposedBlocks: number;
  };
  currentBid: {
    currentBid: number;
    expirationEpoch: number;
  } | null;
  cumulativeBalance: {
    amount: number;
    percentage: number;
  } | null;
  city: string | null;
  country: string | null;
}
