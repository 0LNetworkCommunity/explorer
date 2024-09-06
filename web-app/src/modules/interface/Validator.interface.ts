interface Vouches {
  valid: number;
  total: number;
  compliant: boolean;
  vouchers: {
    address: string;
    epoch: number;
  }[];
}

export interface IValidator {
  address: string;
  handle?: string;
  inSet: boolean;
  index: number;
  votingPower: number;
  balance?: number;
  unlocked?: number;
  vouches: Vouches;
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
  auditQualification: [string] | null;
}
