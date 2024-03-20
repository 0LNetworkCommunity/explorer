import { gql } from '@apollo/client';

export const GET_MOVEMENTS = gql`
  query GetAccountMovements($address: Bytes!) {
    account(address: $address) {
      balance
      movements {
        balance
        version
        transaction {
          __typename
          version
          timestamp
          ... on BlockMetadataTransaction {
            epoch
          }
          ... on UserTransaction {
            success
            moduleName
            moduleAddress
            functionName
            sender
            arguments
          }
        }
      }
    }
  }
`;

export interface GqlAbstractTransaction {
  version: string;
  timestamp: string;
}

export interface GqlBlockMetadataTransaction extends GqlAbstractTransaction {
  __typename: 'BlockMetadataTransaction';
  epoch: string;
}

export interface GqlUserTransaction extends GqlAbstractTransaction {
  __typename: 'UserTransaction';
  moduleAddress: string;
  moduleName: string;
  functionName: string;
  success: boolean;
  sender: string;
  arguments: string;
}

export interface GqlGenesisTransaction extends GqlAbstractTransaction {
  __typename: 'GenesisTransaction';
}

export type GqlTransaction =
  | GqlGenesisTransaction
  | GqlUserTransaction
  | GqlBlockMetadataTransaction;

export interface GqlMovement {
  balance: string;
  transaction: GqlTransaction;
}

export interface GetAccountMovementsRes {
  account: {
    balance: number;
    movements: GqlMovement[];
  };
}
