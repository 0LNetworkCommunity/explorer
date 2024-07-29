import React, { useState } from 'react';
import { gql, useQuery } from '@apollo/client';
import SortableTh from '../../../../ui/Table/SortableTh';
import TopLiquidAccountRow from './TopLiquidAccountRow';
import TopLiquidAccountRowSkeleton from './TopLiquidAccountRowSkeleton';
import { ITopLiquidAccount } from '../../../../interface/TopLiquidAccount.interface';

interface TopLiquidAccountsTableProps {
  accounts?: ITopLiquidAccount[];
}

type SortOrder = 'asc' | 'desc';

const GET_TOP_LIQUID_ACCOUNTS = gql`
  query TopLiquidAccounts {
    getTopLiquidAccounts {
      rank
      address
      unlocked
      liquidShare
    }
  }
`;

const TopLiquidAccountsTable: React.FC<TopLiquidAccountsTableProps> = () => {
  const [sortColumn, setSortColumn] = useState<string>('rank');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  const { data } = useQuery(GET_TOP_LIQUID_ACCOUNTS);
  const accounts: ITopLiquidAccount[] = data ? data.getTopLiquidAccounts : null;

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortOrder('asc');
    }
  };

  const getSortedAccounts = (accounts: ITopLiquidAccount[]) => {
    const sortedAccounts = [...accounts].sort((a, b) => {
      const [aValue, bValue] = getValue(a, b, sortColumn);

      if (aValue === bValue) {
        return a.address.localeCompare(b.address);
      }

      return aValue < bValue ? -1 : 1;
    });

    if (sortOrder === 'asc') {
      sortedAccounts.reverse();
    }

    return sortedAccounts;
  };

  const getValue = (a: ITopLiquidAccount, b: ITopLiquidAccount, column: string): [any, any] => {
    let value1: any;
    let value2: any;

    switch (column) {
      case 'rank':
        value1 = a.rank;
        value2 = b.rank;
        break;
      case 'address':
        value1 = a.address;
        value2 = b.address;
        break;
      case 'unlocked':
        value1 = a.unlocked;
        value2 = b.unlocked;
        break;
      case 'liquidShare':
        value1 = a.liquidShare;
        value2 = b.liquidShare;
        break;
      default:
        value1 = a.rank;
        value2 = b.rank;
    }

    return [value1, value2];
  };

  let sortedAccounts;

  if (accounts) {
    sortedAccounts = getSortedAccounts(accounts);
  }

  const columns = [
    { key: 'rank', label: 'Rank', className: 'text-center' },
    { key: 'address', label: 'Address', className: '' },
    { key: 'unlocked', label: 'Unlocked', className: 'text-right' },
    { key: 'liquidShare', label: '% Of Circulating Supply', className: 'text-right' },
  ];

  return (
    <div className="pb-8">
      <div className="overflow-x-auto">
        <div className="inline-block min-w-full py-2 align-middle">
          <div className="overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-[#FAFAFA]">
                <tr className="text-left text-sm">
                  {columns.map((col) => (
                    <SortableTh
                      key={col.key}
                      column={col.key}
                      sortColumn={sortColumn}
                      sortOrder={sortOrder}
                      onSort={handleSort}
                      className={col.className}
                    >
                      {col.label}
                    </SortableTh>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {sortedAccounts
                  ? sortedAccounts.map((account) => (
                      <TopLiquidAccountRow key={account.address} account={account} />
                    ))
                  : Array.from({ length: 10 }).map((_, index) => (
                      <TopLiquidAccountRowSkeleton key={index} />
                    ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TopLiquidAccountsTable;
