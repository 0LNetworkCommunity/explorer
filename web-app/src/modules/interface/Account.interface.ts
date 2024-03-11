export interface IAccountInfo {
  account: {
    address: string;
    balance: string | null;
    slowWallet: {
      unlocked: string;
    } | null;
  };
}
