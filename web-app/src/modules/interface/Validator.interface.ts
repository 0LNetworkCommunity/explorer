export interface IValidator {
  address: string;
  inSet: boolean;
  votingPower: number;
  account: {
    balance: number;
    slowWallet: {
      unlocked: number;
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
  };
}
