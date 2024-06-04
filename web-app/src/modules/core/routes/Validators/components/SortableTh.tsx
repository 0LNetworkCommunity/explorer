import { FC, ReactNode } from 'react';
import { ArrowUpIcon, ArrowDownIcon } from '@heroicons/react/20/solid';
import clsx from 'clsx';

interface SortableThProps {
  column: string;
  sortColumn: string;
  sortOrder: 'asc' | 'desc';
  onSort: (column: string) => void;
  className?: string;
  children: ReactNode;
}

const SortableTh: FC<SortableThProps> = ({
  column,
  sortColumn,
  sortOrder,
  onSort,
  className,
  children,
}) => {
  return (
    <th
      scope="col"
      className={clsx('text-xs cursor-pointer font-medium py-3 px-6 text-[#525252]', className)}
      onClick={() => onSort(column)}
    >
      {children}
      {sortColumn === column &&
        (sortOrder === 'asc' ? (
          <ArrowUpIcon className="w-4 h-4 inline" />
        ) : (
          <ArrowDownIcon className="w-4 h-4 inline" />
        ))}
    </th>
  );
};

export default SortableTh;
