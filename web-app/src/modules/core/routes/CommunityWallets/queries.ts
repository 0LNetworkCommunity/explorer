import { gql } from '@apollo/client';

export const GET_COMMUNITY_WALLETS_STATS = gql`
  query GetCommunityWalletsStats {
    getCommunityWalletsStats {
      totalBalance
      totalPaid
      totalPending
      totalVetoed
    }
  }
`;

