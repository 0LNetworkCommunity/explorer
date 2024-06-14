import { FC } from 'react';
import { ArrowUpIcon, ArrowDownIcon } from '@heroicons/react/20/solid';

interface SortableThProps {
  column: string;
  sortColumn: string;
  sortOrder: 'asc' | 'desc';
  onSort: (column: string) => void;
  className?: string;
  children: React.ReactNode;
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
      className={`flex-inline text-xs cursor-pointer font-medium py-3 px-6 text-[#525252] whitespace-nowrap ${className}`}
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
