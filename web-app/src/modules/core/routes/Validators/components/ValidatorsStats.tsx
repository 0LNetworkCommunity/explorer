import { FC } from 'react';
import { IValidator } from '../../../../interface/Validator.interface';
import Money from '../../../../ui/Money';

interface ValidatorsStatsProps {
  validators?: IValidator[];
}

const ValidatorsStats: FC<ValidatorsStatsProps> = ({ validators }) => {
  const validatorSet = validators && validators.filter((it) => it.inSet);
  const eligible = validators && validatorSet && validators.length - validatorSet.length;
  const totalLibra =
    validators &&
    validators.reduce((acc, it) => (it.inSet ? acc + Number(it.account.balance) : acc), 0);

  return (
    <div className="grid grid-cols-2 gap-[4px] md:grid-cols-3 lg:grid-cols-4 pb-8">
      <div className="flex flex-col bg-[#F5F5F5] p-5 gap-2">
        <span className="text-sm font-medium text-[#525252]">Active Validators</span>
        <span
          className={`text-xl md:text-2xl tracking-tight text-[#141414] h-8 rounded ${
            !validatorSet ? 'animate-pulse bg-gray-300 text-2xl space-y-4' : ''
          }`}
        >
          {validatorSet && validatorSet.length}
        </span>
      </div>
      <div className="flex flex-col bg-[#F5F5F5] p-5 gap-2">
        <span className="text-sm font-medium text-[#525252]">Total Libra</span>
        <span
          className={`text-xl md:text-2xl tracking-tight text-[#141414] h-8 rounded ${
            !totalLibra ? 'animate-pulse bg-gray-300 text-2xl space-y-4' : ''
          }`}
        >
          {totalLibra && <Money>{totalLibra}</Money>}
        </span>
      </div>
      <div className="flex flex-col bg-[#F5F5F5] p-5 gap-2">
        <span className="text-sm font-medium text-[#525252]">Eligible Validators</span>
        <span
          className={`text-xl md:text-2xl tracking-tight text-[#141414] h-8 rounded ${
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
