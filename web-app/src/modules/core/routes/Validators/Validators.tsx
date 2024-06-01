import { FC } from 'react';
import { gql, useQuery } from '@apollo/client';
import Page from '../../../ui/Page';
import ValidatorsTable from './components/ValidatorsTable';
import ValidatorsStats from './components/ValidatorsStats';

const GET_VALIDATORS = gql`
  query GetValidators {
    validators {
      inSet
      address
      votingPower
      account {
        balance
        slowWallet {
          unlocked
        }
      }
      vouches {
        epoch
      }
      currentBid {
        currentBid
        expirationEpoch
      }
      grade {
        compliant
        failedBlocks
        proposedBlocks
      }
    }
  }
`;

const Validators: FC = () => {
  const { loading, data, error } = useQuery<{
    validators: {
      address: string;
      inSet: boolean;
      votingPower: number;
      account: {
        balance: number;
        slowWallet: {
          unlocked: number;
        } | null;
      };
      vouches: {
        epoch: number;
      }[];
      grade: {
        compliant: boolean;
        failedBlocks: number;
        proposedBlocks: number;
      };
      currentBid: {
        currentBid: number;
        expirationEpoch: number;
      };
    }[];
  }>(GET_VALIDATORS);

  if (!data && loading) {
    return (
      <Page __deprecated_grayBg>
        <div>Loading...</div>
      </Page>
    );
  }

  if (data) {
    return (
      <Page __deprecated_grayBg>
        <section className="my-2 flow-root">
          <ValidatorsStats validators={data.validators} />
          <ValidatorsTable validators={data.validators} />
        </section>
      </Page>
    );
  }

  console.log('error', error);

  if (error) {
    return (
      <Page __deprecated_grayBg>
        <p>{`Error: ${error.message}`}</p>
      </Page>
    );
  }

  return null;
};

export default Validators;
