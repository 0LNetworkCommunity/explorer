import { useState, useEffect } from 'react';
import _ from 'lodash';
import { gql, useQuery } from '@apollo/client';
import { CheckIcon, XMarkIcon } from '@heroicons/react/20/solid';

import { SortOrder, SortableTh } from '../../../../ui/Table';
import { ICommunityWalletDetails } from '../../../../interface/CommunityWallets.interface';
import AccountAddress from '../../../../ui/AccountAddress';

const GET_COMMUNITY_WALLETS_DETAILS = gql`
  query GetCommunityWalletsDetails {
    getCommunityWalletsDetails {
      address
      name
      isMultiAction
      threshold
      totalPaid
      balance
      payees
    }
  }
`;

const formatCoin = (value: number) => {
  return value
    ? value.toLocaleString('en-US', {
        maximumFractionDigits: 0,
      })
    : value;
};

const formatThreshold = (threshold: number[]) => {
  if (Array.isArray(threshold) && threshold.length === 2) {
    return `${threshold[0]} / ${threshold[1]}`;
  }
  return '';
};

const columns = [
  { key: 'address', label: 'Address', className: 'text-left' },
  { key: 'name', label: 'Name', className: '' },
  { key: 'isMultiAction', label: 'Multisign', className: 'text-center' },
  { key: 'threshold', label: 'Threshold', className: 'text-center' },
  { key: 'payees', label: '#Payees', className: 'text-right' },
  { key: 'totalPaid', label: 'Payments', className: 'text-right' },
  { key: 'balance', label: 'Balance', className: 'text-right' },
];

const Details = () => {
  const [sortColumn, setSortColumn] = useState<string>('isMultiAction');
  const [sortOrder, setSortOrder] = useState<SortOrder>(SortOrder.Desc);
  const [sortedDetails, setSortedDetails] = useState<ICommunityWalletDetails[]>([]);
  const { data } = useQuery<{
    getCommunityWalletsDetails: ICommunityWalletDetails[];
  }>(GET_COMMUNITY_WALLETS_DETAILS);
  const details = data?.getCommunityWalletsDetails;

  useEffect(() => {
    const sortedDetails = _.sortBy(details ?? [], sortColumn);
    if (sortOrder === SortOrder.Desc) {
      sortedDetails.reverse();
    }
    setSortedDetails(sortedDetails);
  }, [details, sortColumn, sortOrder]);

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortOrder(sortOrder === SortOrder.Asc ? SortOrder.Desc : SortOrder.Asc);
    } else {
      setSortColumn(column);
      setSortOrder(SortOrder.Desc);
    }
  };

  return (
    <div className="overflow-x-auto relative pt-2">
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
        <tbody>
          {sortedDetails.length > 0 ? (
            sortedDetails.map((wallet, index) => (
              <tr key={index} className={`border-b text-sm text-[#141414]`}>
                <td className="py-2 px-4 text-center">
                  <AccountAddress address={wallet.address} />
                </td>
                <td className="py-2 px-4">{wallet.name}</td>
                <td className="py-2 px-4 text-center">
                  {wallet.isMultiAction ? (
                    <CheckIcon className="w-5 h-5 text-green-500 inline" />
                  ) : (
                    <XMarkIcon className="w-5 h-5 text-red-500 inline" />
                  )}
                </td>
                <td className="py-2 px-4 text-center">{formatThreshold(wallet.threshold)}</td>
                <td className="py-2 px-4 text-right">{wallet.payees}</td>
                <td className="py-2 px-4 text-right">{formatCoin(wallet.totalPaid)}</td>
                <td className="py-2 px-4 text-right">{formatCoin(wallet.balance)}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={columns.length} className="text-center py-4">
                No data available
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default Details;
