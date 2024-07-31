import React, { useState, useMemo, useEffect } from 'react';
import Decimal from 'decimal.js';
import _ from 'lodash';

import AccountAddress from '../../../../ui/AccountAddress';
import LibraAmount from '../../../../ui/LibraAmount';
import {
  ICommunityWalletPayments,
  IPayment,
} from '../../../../interface/CommunityWallets.interface';
import { SortableTh, SortOrder } from '../../../../ui/Table';
import { PaymentStatus } from './types';

interface IFlatPayment extends IPayment {
  address: string;
  name: string;
}

interface PaymentsTableProps {
  payments: ICommunityWalletPayments[];
  status: PaymentStatus;
}

const PaymentsTable: React.FC<PaymentsTableProps> = ({ payments, status }) => {
  const [sortColumn, setSortColumn] = useState<string>('deadline');
  const [sortOrder, setSortOrder] = useState<SortOrder>(SortOrder.Asc);
  const [sortedPayments, setSortedPayments] = useState<IFlatPayment[]>([]);

  const filteredPayments = useMemo(() => {
    const flatPayments: IFlatPayment[] = [];
    for (const wallet of payments) {
      for (const payment of wallet[status]) {
        flatPayments.push({
          ...payment,
          address: wallet.address,
          name: wallet.name,
        });
      }
    }
    return flatPayments;
  }, [payments, status]);

  useEffect(() => {
    const sortedPayments = _.sortBy(filteredPayments, sortColumn);
    if (sortOrder === SortOrder.Desc) {
      sortedPayments.reverse();
    }
    setSortedPayments(sortedPayments);
  }, [filteredPayments, sortColumn, sortOrder]);

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortOrder(sortOrder === SortOrder.Asc ? SortOrder.Desc : SortOrder.Asc);
    } else {
      setSortColumn(column);
      setSortOrder(SortOrder.Asc);
    }
  };

  if (filteredPayments.length === 0) {
    return (
      <div className="py-2">
        <p className="ml-4">No {status} payments found at the moment.</p>
      </div>
    );
  }

  const columns = [
    { key: 'address', label: 'Address', className: 'text-left' },
    { key: 'name', label: 'Name', className: 'text-left' },
    { key: 'deadline', label: 'Deadline', className: 'text-center' },
    { key: 'payee', label: 'Payee', className: 'text-left' },
    { key: 'description', label: 'Description', className: 'text-left' },
    { key: 'value', label: 'Amount', className: 'text-right' },
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
                {sortedPayments.map((payment, index) => (
                  <tr key={index} className={`border-b text-sm text-[#141414]`}>
                    <td className="py-2 px-2 md:px-4 lg:px-6">
                      <AccountAddress address={payment.address} />
                    </td>
                    <td className="py-2 px-2 md:px-4 lg:px-6">{payment.name}</td>
                    <td className="py-2 px-2 md:px-4 lg:px-6 text-center">{payment.deadline}</td>
                    <td className="py-2 px-2 md:px-4 lg:px-6">
                      <AccountAddress address={payment.payee} />
                    </td>
                    <td className="py-2 px-2 md:px-4 lg:px-6">{payment.description}</td>
                    <td className="py-2 px-2 md:px-4 lg:px-6 text-right">
                      <LibraAmount>{new Decimal(payment.value)}</LibraAmount>{' '}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentsTable;
