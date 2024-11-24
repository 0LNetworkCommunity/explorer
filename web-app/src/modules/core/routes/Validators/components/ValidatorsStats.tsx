import { FC } from 'react';
import Money from '../../../../ui/Money';
import StatsCard from '../../../../ui/StatsCard';
import { IValidator } from '../../../../interface/Validator.interface';
import { gql, useQuery } from '@apollo/client';

const GET_VALIDATOR_UTILS = gql`
  query ValidatorUtils {
    getValidatorUtils {
      vouchPrice
      entryFee
      clearingBid
      netReward
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
  const utils = data ? data.getValidatorUtils : null;

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
      <StatsCard title="Entry Fee" value={utils ? utils.entryFee : null}>
        {utils && <Money>{Math.ceil(utils.entryFee / 1_000_000)}</Money>}
        <span className="ml-2" style={{ fontSize: '16px' }}>
          ({utils && formatPercentage(utils.clearingBid)})
        </span>
      </StatsCard>
      <StatsCard title="Net Reward" value={utils ? utils.netReward : null}>
        {utils && <Money>{Math.ceil(utils.netReward / 1_000_000)}</Money>}
      </StatsCard>
    </div>
  );
};

// format percentage 1 decimal
function formatPercentage(value: number) {
  console.log('value', value);
  return `${(value / 10).toFixed(1)}%`;
}

export default ValidatorsStats;
