import clsx from 'clsx';
import { FC, PropsWithChildren, ReactNode } from 'react';

type Props = PropsWithChildren<{
  title?: ReactNode;
  subtitle?: ReactNode;
}>;

const ChartContainer: FC<Props> = ({ title, subtitle, children }) => {
  return (
    <div className="rounded-lg bg-white px-4 pb-12 pt-5 shadow sm:px-6 sm:pt-6">
      {title && <dt className="text-sm font-medium leading-6 text-gray-500">{title}</dt>}
      {subtitle && <dd className={clsx('text-gray-700', 'text-xs font-medium')}>{subtitle}</dd>}
      <dd className="w-full flex-none text-3xl font-medium leading-10 tracking-tight text-gray-900">
        {children}
      </dd>
    </div>
  );
};

export default ChartContainer;
