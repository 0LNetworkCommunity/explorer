import {
  CommunityWallet,
  CommunityWalletStats,
  CommunityWalletDetails,
  CommunityWalletPayments,
} from './community-wallet.model.js';

export interface ICommunityWalletsService {
  getCommunityWallets(): Promise<CommunityWallet[]>;
  getCommunityWalletsStats(): Promise<CommunityWalletStats>;
  getCommunityWalletsDetails(): Promise<CommunityWalletDetails[]>;
  getCommunityWalletsPayments(): Promise<CommunityWalletPayments[]>;
  updateAllCaches(): Promise<void>;
}
