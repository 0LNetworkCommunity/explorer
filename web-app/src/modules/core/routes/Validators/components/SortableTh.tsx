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
      className={clsx(
        'flex-inline text-xs cursor-pointer font-medium py-3 px-6 text-[#525252] whitespace-nowrap',
        className,
      )}
      onClick={() => onSort(column)}
    >
      <span style={{ height: '18px', marginRight: '2px' }}>{children}</span>
      {sortColumn === column &&
        (sortOrder === 'asc' ? (
          <ArrowUpIcon className="w-4 h-4 inline" style={{ marginTop: '-4px' }} />
        ) : (
          <ArrowDownIcon className="w-4 h-4 inline" style={{ marginTop: '-4px' }} />
        ))}
    </th>
  );
};

export default SortableTh;
