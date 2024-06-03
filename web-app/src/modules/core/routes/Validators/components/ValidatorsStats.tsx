import { FC } from 'react';
import { IValidator } from '../../../../interface/Validator.interface';

interface ValidatorsStatsProps {
  validators?: IValidator[];
}

const ValidatorsStats: FC<ValidatorsStatsProps> = ({ validators }) => {
  const validatorSet = validators && validators.filter((it) => it.inSet);
  const eligible = validators && validatorSet && validators.length - validatorSet.length;

  return (
    <div className="grid grid-cols-2 gap-[4px] md:grid-cols-4 pb-8">
      <div className="flex flex-col bg-[#F5F5F5] p-5 gap-2">
        <span className="text-sm font-medium text-[#525252]">Active Validators</span>
        <span
          className={`text-2xl md:text-3xl tracking-tight text-[#141414] h-8 rounded ${
            !validatorSet ? 'animate-pulse bg-gray-300 text-2xl space-y-4' : ''
          }`}
        >
          {validatorSet && validatorSet.length}
        </span>
      </div>
      <div className="flex flex-col bg-[#F5F5F5] p-5 gap-2">
        <span className="text-sm font-medium text-[#525252]">Eligible Validators</span>
        <span
          className={`text-2xl md:text-3xl tracking-tight text-[#141414] h-8 rounded ${
            !eligible ? 'animate-pulse bg-gray-300 text-2xl space-y-4' : ''
          }`}
        >
          {eligible}
        </span>
      </div>
    </div>
  );
};

export default ValidatorsStats;
