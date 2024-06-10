import { FC } from 'react';
import Money from '../../../../ui/Money';
import StatsCard from '../../../../ui/StatsCard';
import { IValidator } from '../../../../interface/Validator.interface';

interface ValidatorsStatsProps {
  validators?: IValidator[];
}

const ValidatorsStats: FC<ValidatorsStatsProps> = ({ validators }) => {
  const validatorSet = validators && validators.filter((it) => it.inSet);
  const eligible = validators && validatorSet && validators.length - validatorSet.length;
  const totalLibra = validators && validators.reduce((acc, it) => acc + Number(it.balance), 0);
  const liquidLibra = validators && validators.reduce((acc, it) => acc + Number(it.unlocked), 0);

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
    </div>
  );
};

export default ValidatorsStats;
