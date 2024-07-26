import { gql } from '@apollo/client';

export const GET_COMMUNITY_WALLETS = gql`
  query GetCommunityWallets {
    getCommunityWallets {
      rank
      address
      name
      balance
      description
    }
  }
`;

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

export const GET_COMMUNITY_WALLETS_PAYMENTS = gql`
  query GetCommunityWalletsPayments {
    getCommunityWalletsPayments {
      address
      name
      paid {
        deadline
        payee
        description
        value
        status
      }
      pending {
        deadline
        payee
        description
        value
        status
      }
      vetoed {
        deadline
        payee
        description
        value
        status
      }
    }
  }
`;

export const GET_COMMUNITY_WALLETS_DETAILS = gql`
  query GetCommunityWalletsDetails {
    getCommunityWalletsDetails {
      address
      name
      isMultiAction
      threshold
      totalPaid
      balance
      payees
    }
  }
`;
