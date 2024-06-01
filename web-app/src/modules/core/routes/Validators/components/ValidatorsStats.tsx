import { FC } from 'react';
import { IValidator } from '../../../../interface/Validator.interface';

interface ValidatorsStatsProps {
  validators: IValidator[];
}

const ValidatorsStats: FC<ValidatorsStatsProps> = ({ validators }) => {
  const validatorSet = validators.filter((it) => it.inSet);
  const eligible = validators.length - validatorSet.length;

  return (
    <div>
      <dl className="md:w-1/2 grid gap-0.5 shadow overflow-hidden rounded-lg text-center grid-cols-2 m-2">
        <div className="flex flex-col bg-white p-4">
          <dt className="text-sm font-semibold leading-6 text-gray-600">Validator Set</dt>
          <dd className="order-first text-3xl tracking-tight text-gray-900 font-mono">
            {validatorSet.length}
          </dd>
        </div>
        <div className="flex flex-col bg-white p-4">
          <dt className="text-sm font-semibold leading-6 text-gray-600">Eligible</dt>
          <dd className="order-first text-3xl tracking-tight text-gray-900 font-mono">
            {eligible}
          </dd>
        </div>
      </dl>
    </div>
  );
};

export default ValidatorsStats;
