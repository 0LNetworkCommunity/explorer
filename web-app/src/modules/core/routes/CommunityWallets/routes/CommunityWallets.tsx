import { useState, useEffect } from 'react';
import _ from 'lodash';
import { gql, useQuery } from '@apollo/client';

import { SortableTh, SortOrder } from '../../../../ui/Table';
import CommunityWalletRow from '../components/CommunityWalletRow';
import CommunityWalletRowSkeleton from '../components/CommunityWalletRowSkeleton';
import { ICommunityWallet } from '../../../../interface/CommunityWallets.interface';

const GET_COMMUNITY_WALLETS = gql`
  query GetCommunityWallets {
    getCommunityWallets {
      rank
      address
      name
      balance
      description
    }
  }
`;

const columns = [
  { key: 'rank', label: 'Rank', className: 'text-center' },
  { key: 'address', label: 'Address', className: '' },
  { key: 'name', label: 'Name', className: 'text-left' },
  { key: 'description', label: 'Description', className: 'text-left' },
  { key: 'balance', label: 'Balance', className: 'text-right' },
];

const CommunityWallets = () => {
  const [sortColumn, setSortColumn] = useState<string>('balance');
  const [sortOrder, setSortOrder] = useState<SortOrder>(SortOrder.Desc);
  const [sortedWallets, setSortedWallets] = useState<ICommunityWallet[]>([]);

  const { data } = useQuery<{ getCommunityWallets: ICommunityWallet[] }>(GET_COMMUNITY_WALLETS);
  const wallets = data?.getCommunityWallets;

  useEffect(() => {
    const sortedWallets = _.sortBy(wallets ?? [], sortColumn);
    if (sortOrder === SortOrder.Desc) {
      sortedWallets.reverse();
    }
    setSortedWallets(sortedWallets);
  }, [wallets, sortColumn, sortOrder]);

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
                {sortedWallets.length > 0
                  ? sortedWallets.map((wallet) => (
                      <CommunityWalletRow key={wallet.address} wallet={wallet} />
                    ))
                  : new Array(10)
                      .fill(0)
                      .map((_, index) => <CommunityWalletRowSkeleton key={index} />)}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommunityWallets;
