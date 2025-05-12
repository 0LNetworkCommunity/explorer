export interface IAccountInfo {
  account: {
    address: string;
    balance: string | null;
    initialized: boolean;
    slowWallet: {
      unlocked: string;
    } | null;
  };
}
