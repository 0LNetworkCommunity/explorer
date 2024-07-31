import { FC, useState, useEffect } from 'react';
import _ from 'lodash';
import { gql, useQuery } from '@apollo/client';

import { ITopAccount } from '../../../../interface/TopAccount.interface';
import { SortableTh, SortOrder } from '../../../../ui/Table';
import TopAccountRow from './TopAccountRow';
import TopAccountRowSkeleton from './TopAccountRowSkeleton';

interface TopAccountsTableProps {
  accounts?: ITopAccount[];
}

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

const columns = [
  { key: 'rank', label: 'Rank', className: 'text-center' },
  { key: 'address', label: 'Address', className: '' },
  { key: 'publicName', label: 'Public Name', className: 'text-left' },
  { key: 'balance', label: 'Balance', className: 'text-right' },
  { key: 'cumulativeShare', label: 'Cumulative Share (%)', className: 'text-right' },
];

const TopAccountsTable: FC<TopAccountsTableProps> = () => {
  const [sortColumn, setSortColumn] = useState('rank');
  const [sortOrder, setSortOrder] = useState(SortOrder.Asc);
  const [sortedAccounts, setSortedAccounts] = useState<ITopAccount[]>([]);

  const { data } = useQuery(GET_TOP_ACCOUNTS);
  const accounts: ITopAccount[] = data ? data.getTopAccounts : null;

  useEffect(() => {
    const sortedAccounts = _.sortBy(accounts, sortColumn);
    if (sortOrder === SortOrder.Desc) {
      sortedAccounts.reverse();
    }
    setSortedAccounts(sortedAccounts);
  }, [accounts, sortColumn, sortOrder]);

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortOrder(sortOrder === SortOrder.Asc ? SortOrder.Desc : SortOrder.Asc);
    } else {
      setSortColumn(column);
      setSortOrder(SortOrder.Desc);
    }
  };

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
                {sortedAccounts.length
                  ? sortedAccounts.map((account) => (
                      <TopAccountRow key={account.address} account={account} />
                    ))
                  : new Array(10).fill(0).map((_, index) => <TopAccountRowSkeleton key={index} />)}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TopAccountsTable;
