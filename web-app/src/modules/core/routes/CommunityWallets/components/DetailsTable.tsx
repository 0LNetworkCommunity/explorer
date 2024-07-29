import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { CheckIcon, XMarkIcon } from '@heroicons/react/20/solid';
import SortableTh from '../../../../ui/Table/SortableTh';
import { ICommunityWalletDetails } from '../../../../interface/CommunityWallets.interface';
import AccountAddress from '../../../../ui/AccountAddress';

type SortOrder = 'asc' | 'desc';

const DetailsTable: React.FC<{ details: ICommunityWalletDetails[] }> = ({ details }) => {
  const [sortColumn, setSortColumn] = useState<string>('isMultiAction');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [sortedDetails, setSortedDetails] = useState<ICommunityWalletDetails[]>([]);

  useEffect(() => {
    setSortedDetails(getSortedDetails(details));
  }, [details, sortColumn, sortOrder]);

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortOrder('asc');
    }
    setSortedDetails(getSortedDetails(details));
  };

  const getSortedDetails = (details: ICommunityWalletDetails[]) => {
    const sortableDetails = [...details].sort((a, b) => {
      const [aValue, bValue] = getValue(a, b, sortColumn);

      if (aValue === bValue) {
        return a.address.localeCompare(b.address);
      }

      return aValue < bValue ? -1 : 1;
    });

    if (sortOrder === 'asc') {
      sortableDetails.reverse();
    }

    return sortableDetails;
  };

  const getValue = (
    a: ICommunityWalletDetails,
    b: ICommunityWalletDetails,
    column: string,
  ): [any, any] => {
    let value1: any;
    let value2: any;

    switch (column) {
      case 'address':
        value1 = a.address;
        value2 = b.address;
        break;
      case 'name':
        value1 = a.name;
        value2 = b.name;
        break;
      case 'isMultiAction':
        value1 = a.isMultiAction;
        value2 = b.isMultiAction;
        break;
      case 'threshold':
        value1 = a.threshold;
        value2 = b.threshold;
        break;
      case 'payees':
        value1 = a.payees;
        value2 = b.payees;
        break;
      case 'totalPaid':
        value1 = a.totalPaid;
        value2 = b.totalPaid;
        break;
      case 'balance':
        value1 = a.balance;
        value2 = b.balance;
        break;
      default:
        value1 = a.totalPaid;
        value2 = b.totalPaid;
    }

    return [value1, value2];
  };

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

DetailsTable.propTypes = {
  details: PropTypes.array.isRequired,
};

export default DetailsTable;
