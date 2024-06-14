import { FC } from 'react';
import { gql, useQuery } from '@apollo/client';
import Page from '../../../ui/Page';
import ValidatorsTable from './components/ValidatorsTable';
import ValidatorsStats from './components/ValidatorsStats';

const GET_VALIDATORS = gql`
  query Validators {
    getValidators {
      inSet
      index
      address
      votingPower
      balance
      unlocked
      grade {
        compliant
        failedBlocks
        proposedBlocks
      }
      grade {
        compliant
        failedBlocks
        proposedBlocks
      }
      vouches {
        address
        epoch
      }
      currentBid {
        currentBid
        expirationEpoch
      }
      city
      country
      audit_qualification
    }
  }
`;

const Validators: FC = () => {
  const { data, error } = useQuery<{
    getValidators: {
      address: string;
      inSet: boolean;
      index: number;
      votingPower: number;
      balance: number;
      unlocked: number;
      vouches: {
        epoch: number;
        address: string;
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
      audit_qualification: [string] | null;
    }[];
  }>(GET_VALIDATORS);

  if (error) {
    console.log('error', error);
    return (
      <Page>
        <p>{`Error: ${error.message}`}</p>
      </Page>
    );
  }

  return (
    <Page>
      <h1 className="font-space-grotesk text-3xl md:text-4xl font-medium leading-[44px] tracking-[-0.02em] text-left mt-6 mb-6">
        Validators
      </h1>
      <section className="my-2 flow-root">
        <ValidatorsStats validators={data && data.getValidators} />
        <ValidatorsTable validators={data && data.getValidators} />
      </section>
    </Page>
  );
};

export default Validators;
