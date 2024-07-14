import { GqlCommunityWallet } from './community-wallet.model.js';

export interface ICommunityWalletsService {
  getCommunityWallets(): Promise<GqlCommunityWallet[]>;
}
