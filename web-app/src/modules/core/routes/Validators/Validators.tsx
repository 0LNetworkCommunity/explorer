import { FC, useState } from 'react';
import { gql, useQuery } from '@apollo/client';
import Page from '../../../ui/Page';
import ValidatorsTable from './components/ValidatorsTable';
import ValidatorsStats from './components/ValidatorsStats';
import VouchesTable from './components/VouchesTable';
import ToggleButton from '../../../ui/ToggleButton';

const GET_VALIDATORS = gql`
  query Validators {
    getValidators {
      inSet
      index
      address
      handle
      votingPower
      balance
      unlocked
      grade {
        compliant
        failedBlocks
        proposedBlocks
      }
      vouches {
        compliant
        valid
        total
        vouchers {
          address
          epoch
        }
      }
      currentBid {
        currentBid
        expirationEpoch
      }
      city
      country
      auditQualification
    }
  }
`;

const Validators: FC = () => {
  const [activeValue, setActiveValue] = useState<string>('active');

  const { data, error } = useQuery(GET_VALIDATORS, {
    pollInterval: 30000, // Poll every 30 seconds
  });

  if (error) {
    console.log('error', error);
    return (
      <Page>
        <p>{`Error: ${error.message}`}</p>
      </Page>
    );
  }

  const toggleOptions = [
    { label: 'Active', value: 'active' },
    { label: 'Inactive', value: 'inactive' },
    { label: 'Vouches', value: 'vouches' },
  ];

  return (
    <Page>
      <h1 className="font-space-grotesk text-3xl md:text-4xl font-medium leading-[44px] tracking-[-0.02em] text-left mt-6 mb-6">
        Validators
      </h1>
      <section className="my-2 flow-root">
        <ValidatorsStats validators={data && data.getValidators} />
        <div className="py-8">
          <ToggleButton
            options={toggleOptions}
            activeValue={activeValue}
            onToggle={setActiveValue}
          />
          {activeValue === 'vouches' ? <VouchesTable /> : null}
          {activeValue === 'active' || activeValue === 'inactive' ? (
            <ValidatorsTable validators={data && data.getValidators} activeValue={activeValue} />
          ) : null}
        </div>
      </section>
    </Page>
  );
};

export default Validators;
