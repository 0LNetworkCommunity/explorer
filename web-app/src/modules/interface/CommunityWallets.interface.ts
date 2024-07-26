export interface ICommunityWallet {
  rank: number;
  address: string;
  name?: string;
  balance: number;
  description?: string;
}

export interface IPayment {
  deadline: string;
  payee: string;
  description: string;
  value: number;
  status: string;
}

export interface ICommunityWalletPayments {
  address: string;
  name: string;
  paid: IPayment[];
  pending: IPayment[];
  vetoed: IPayment[];
}

export interface ICommunityWalletDetails {
  address: string;
  name: string;
  isMultiAction: boolean;
  threshold: number[];
  totalPaid: number;
  balance: number;
  payees: number;
}
