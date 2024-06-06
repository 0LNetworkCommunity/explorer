import { FC, useState } from 'react';
import { gql, useQuery } from '@apollo/client';
import { ITopAccount } from '../../../../interface/TopAccount.interface';
import SortableTh from './SortableTh';
import TopAccountRow from './TopAccountRow';
import TopAccountRowSkeleton from './TopAccountRowSkeleton';

interface TopAccountsTableProps {
  accounts?: ITopAccount[];
}

type SortOrder = 'asc' | 'desc';

const GET_TOP_ACCOUNTS = gql`
  query Accounts {
    getTopAccounts {
      rank
      address
      publicName
      balance
      cumulativeShare {
        amount
        percentage
      }
    }
  }
`;

const TopAccountsTable: FC<TopAccountsTableProps> = () => {
  const [sortColumn, setSortColumn] = useState<string>('rank');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  const { error, data } = useQuery(GET_TOP_ACCOUNTS);
  const accounts: ITopAccount[] = data ? data.getTopAccounts : null;

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortOrder('asc');
    }
  };

  const getSortedAccounts = (accounts: ITopAccount[]) => {
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

  const getValue = (a: ITopAccount, b: ITopAccount, column: string): [any, any] => {
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
      case 'publicName':
        value1 = a.publicName;
        value2 = b.publicName;
        break;
      case 'balance':
        value1 = a.balance;
        value2 = b.balance;
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
    { key: 'publicName', label: 'Public Name', className: 'text-left' },
    { key: 'balance', label: 'Balance', className: 'text-right' },
    { key: 'cumulativeShare', label: 'Cumulative Share (%)', className: 'text-right' },
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
                      <TopAccountRow key={account.address} account={account} />
                    ))
                  : Array.from({ length: 10 }).map((_, index) => (
                      <TopAccountRowSkeleton key={index} />
                    ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TopAccountsTable;
