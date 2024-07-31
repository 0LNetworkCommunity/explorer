import { FC, ReactNode } from 'react';
import { ArrowUpIcon, ArrowDownIcon } from '@heroicons/react/20/solid';
import { SortOrder } from './types';

interface SortableThProps {
  column: string;
  sortColumn: string;
  sortOrder: SortOrder;
  onSort: (column: string) => void;
  className?: string;
  children: ReactNode;
}

export const SortableTh: FC<SortableThProps> = ({
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
      className={`flex-inline text-xs cursor-pointer font-medium py-3 px-2 md:px-4 lg:px-6 text-[#525252] whitespace-nowrap ${className}`}
      onClick={() => onSort(column)}
    >
      {children}
      {sortColumn === column &&
        (sortOrder === SortOrder.Asc ? (
          <ArrowUpIcon className="w-4 h-4 inline" />
        ) : (
          <ArrowDownIcon className="w-4 h-4 inline" />
        ))}
    </th>
  );
};
