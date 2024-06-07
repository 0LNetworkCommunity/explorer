import { FC } from 'react';
import { gql, useQuery } from '@apollo/client';

import Page from '../../../ui/Page';
import ValidatorsTable from './components/ValidatorsTable';
import ValidatorsStats from './components/ValidatorsStats';
import { IValidator } from '../../../interface/Validator.interface';

const GET_VALIDATORS = gql`
  query GetValidators {
    validators {
      inSet
      index
      address
      votingPower
      account {
        balance
        slowWallet {
          unlocked
        }
      }
      grade {
        compliant
        failedBlocks
        proposedBlocks
      }
      vouches {
        epoch
      }
      currentBid {
        currentBid
        expirationEpoch
      }
      city
      country
    }
  }
`;

const Validators: FC = () => {
  const { data, error } = useQuery<{
    validators: IValidator[];
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
        <ValidatorsStats validators={data && data.validators} />
        <ValidatorsTable validators={data && data.validators} />
      </section>
    </Page>
  );
};

export default Validators;
