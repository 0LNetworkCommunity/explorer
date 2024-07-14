import clsx from 'clsx';
import { FC, PropsWithChildren, ReactNode } from 'react';

type Props = PropsWithChildren<{
  name: ReactNode;
  secondary?: ReactNode;
}>;

const StatItem: FC<Props> = ({ name, secondary, children }) => {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2 bg-white px-4 py-5 sm:px-6 xl:px-8">
      <dt className="text-sm font-medium leading-6 text-gray-500">{name}</dt>
      {secondary && <dd className={clsx('text-gray-700', 'text-xs font-medium')}>{secondary}</dd>}
      <dd className="w-full flex-none text-3xl font-medium leading-10 tracking-tight text-gray-900">
        {children}
      </dd>
    </div>
  );
};

export default StatItem;
