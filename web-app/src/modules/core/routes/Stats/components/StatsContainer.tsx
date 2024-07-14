import clsx from 'clsx';
import { FC, PropsWithChildren } from 'react';

type Props = PropsWithChildren<{
  columns: number;
}>;

const StatsContainer: FC<Props> = ({ columns, children }) => {
  return (
    <dl
      className={clsx(
        'mt-2',
        'rounded-lg bg-white shadow overflow-hidden',
        'mx-auto grid bg-gray-900/5',
        `lg:grid-cols-${columns} lg:divide-x lg:divide-y-0`,
        `grid-cols-1 divide-y`,
      )}
    >
      {children}
    </dl>
  );
};

export default StatsContainer;
