import { gql } from '@apollo/client';

export const GET_MOVEMENTS = gql`
  query GetAccountMovements($address: Bytes!, $order: OrderDirection, $first: Int, $after: String) {
    account(address: $address) {
      balance
      movements(order: $order, after: $after, first: $first) {
        totalCount
        pageInfo {
          prevCursor
          hasNextPage
        }
        edges {
          cursor
          node {
            amount
            unlockedAmount
            lockedAmount
            balance
            lockedBalance
            version
            transaction {
              __typename
              version
              ... on BlockMetadataTransaction {
                epoch
                timestamp
              }
              ... on UserTransaction {
                success
                moduleName
                moduleAddress
                functionName
                sender
                arguments
                timestamp
              }
              ... on ScriptUserTransaction {
                timestamp
              }
            }
          }
        }
      }
    }
  }
`;

export interface GqlAbstractTransaction {
  version: string;
}

export interface GqlBlockMetadataTransaction extends GqlAbstractTransaction {
  __typename: 'BlockMetadataTransaction';
  epoch: string;
  timestamp: string;
}

export interface GqlUserTransaction extends GqlAbstractTransaction {
  __typename: 'UserTransaction';
  moduleAddress: string;
  moduleName: string;
  functionName: string;
  success: boolean;
  sender: string;
  arguments: string;
  timestamp: string;
}

export interface GqlGenesisTransaction extends GqlAbstractTransaction {
  __typename: 'GenesisTransaction';
}

export interface GqlScriptUserTransaction extends GqlAbstractTransaction {
  __typename: 'ScriptUserTransaction';
  success: boolean;
  sender: string;
  timestamp: string;
}

export type GqlTransaction =
  | GqlGenesisTransaction
  | GqlUserTransaction
  | GqlBlockMetadataTransaction
  | GqlScriptUserTransaction;

export interface GqlMovement {
  amount: string;
  lockedAmount: string;
  unlockedAmount: string;
  balance: string;
  lockedBalance: string;
  version: string;
  transaction: GqlTransaction;
}

export interface Edge<T> {
  cursor: string;
  node: T;
}

export interface PageInfo {
  prevCursor: string | null;
  hasNextPage: boolean;
}

export interface Paginated<T> {
  edges: Edge<T>[];
  pageInfo: PageInfo;
  totalCount: number;
}

export interface GetAccountMovementsRes {
  account: {
    balance: number;
    movements: Paginated<GqlMovement>;
  };
}
