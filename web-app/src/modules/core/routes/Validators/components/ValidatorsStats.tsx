import { FC } from 'react';
import Money from '../../../../ui/Money';
import StatsCard from '../../../../ui/StatsCard';
import { IValidator } from '../../../../interface/Validator.interface';
import { gql, useQuery } from '@apollo/client';

const GET_VALIDATOR_UTILS = gql`
  query ValidatorUtils {
    getValidatorUtils {
      vouchPrice
      thermostatMeasure {
        nextEpoch
        amount
        percentage
        didIncrease
      }
    }
  }
`;

interface ValidatorsStatsProps {
  validators?: IValidator[];
}

const ValidatorsStats: FC<ValidatorsStatsProps> = ({ validators }) => {
  const { data, error } = useQuery(GET_VALIDATOR_UTILS, {
    pollInterval: 30000, // Poll every 30 seconds
  });

  if (error) {
    console.log('error', error);
    return <p>{`Error: ${error.message}`}</p>;
  }

  const validatorSet = validators && validators.filter((it) => it.inSet);
  const eligible = validators && validatorSet && validators.length - validatorSet.length;
  const totalLibra = validators && validators.reduce((acc, it) => acc + Number(it.balance), 0);
  const liquidLibra = validators && validators.reduce((acc, it) => acc + Number(it.unlocked), 0);

  // utils
  const utils = data ? data.getValidatorUtils : null;

  const thermostatTitle = utils
    ? `Next Epoch Reward (${utils.thermostatMeasure.nextEpoch})`
    : 'Next Epoch Reward';

  return (
    <div className="grid grid-cols-2 gap-[4px] md:grid-cols-3 lg:grid-cols-4 pb-8">
      <StatsCard title="Active Validators" value={validatorSet ? validatorSet.length : null} />
      <StatsCard title="Eligible Validators" value={eligible ? eligible : null} />
      <StatsCard title="Total Libra" value={totalLibra ? totalLibra : null}>
        {totalLibra && <Money>{totalLibra}</Money>}
      </StatsCard>
      <StatsCard title="Liquid Libra" value={liquidLibra ? liquidLibra : null}>
        {liquidLibra && <Money>{liquidLibra}</Money>}
      </StatsCard>
      <StatsCard title="Vouch Price" value={utils ? utils.vouchPrice : null}>
        {utils && <Money>{Math.ceil(utils.vouchPrice / 1_000_000)}</Money>}
      </StatsCard>
      <StatsCard title={thermostatTitle} value={utils ? utils.vouchPrice : null}>
        {utils && <Money>{Math.ceil(utils.thermostatMeasure.amount / 1_000_000)}</Money>}{' '}
        <span style={{ fontSize: '16px' }}>
          (
          {utils &&
            formatPercentage(
              utils.thermostatMeasure.percentage,
              utils.thermostatMeasure.amount !== 0,
              utils.thermostatMeasure.didIncrease,
            )}
          )
        </span>
      </StatsCard>
    </div>
  );
};

// print percentage 0-100
function formatPercentage(value: number, didChange: boolean, didIncrease: boolean) {
  if (didChange) {
    return didIncrease ? `+${value}%` : `-${value}%`;
  }
  return `${value}%`;
}

export default ValidatorsStats;
