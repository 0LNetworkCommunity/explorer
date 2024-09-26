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
  family: string;
  handle?: string;
  inSet: boolean;
  index: number;
  votingPower: number;
  vfnStatus: string;
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

export type VouchDetails = {
  handle: string;
  compliant: boolean;
  epochsToExpire: number;
  inSet: boolean;
  family: string;
};

export type ValidatorVouches = {
  address: string;
  handle: string;
  inSet: boolean;
  family: string;
  compliant: boolean;
  validVouches: number;
  receivedVouches: VouchDetails[];
  givenVouches: VouchDetails[];
};
