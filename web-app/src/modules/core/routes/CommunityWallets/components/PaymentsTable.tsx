import React, { useState, useMemo, useEffect } from 'react';
import AccountAddress from '../../../../ui/AccountAddress';
import LibraAmount from '../../../../ui/LibraAmount';
import Decimal from 'decimal.js';
import {
  ICommunityWalletPayments,
  IPayment,
} from '../../../../interface/CommunityWallets.interface';
import SortableTh from '../../../../ui/Table/SortableTh';

interface IFlatPayment extends IPayment {
  address: string;
  name: string;
}

interface PaymentsTableProps {
  payments: ICommunityWalletPayments[];
  status: 'paid' | 'pending' | 'vetoed';
}

const PaymentsTable: React.FC<PaymentsTableProps> = ({ payments, status }) => {
  const [sortColumn, setSortColumn] = useState<string>('deadline');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [sortedPayments, setSortedPayments] = useState<IFlatPayment[]>([]);

  const filteredPayments = useMemo(() => {
    const flatPayments: IFlatPayment[] = [];
    payments.forEach((wallet) => {
      wallet[status].forEach((payment) => {
        flatPayments.push({
          ...payment,
          address: wallet.address,
          name: wallet.name,
        });
      });
    });
    return flatPayments;
  }, [payments, status]);

  useEffect(() => {
    setSortedPayments(getSortedPayments(filteredPayments));
  }, [filteredPayments, sortColumn, sortOrder]);

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortOrder('asc');
    }
    setSortedPayments(getSortedPayments(filteredPayments));
  };

  const getSortedPayments = (payments: IFlatPayment[]) => {
    const sortablePayments = [...payments].sort((a, b) => {
      const [aValue, bValue] = getValue(a, b, sortColumn);

      if (aValue === bValue) {
        return a.address.localeCompare(b.address);
      }

      return aValue < bValue ? -1 : 1;
    });

    if (sortOrder === 'asc') {
      sortablePayments.reverse();
    }

    return sortablePayments;
  };

  const getValue = (a: IFlatPayment, b: IFlatPayment, column: string): [any, any] => {
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
      case 'deadline':
        value1 = a.deadline;
        value2 = b.deadline;
        break;
      case 'payee':
        value1 = a.payee;
        value2 = b.payee;
        break;
      case 'description':
        value1 = a.description;
        value2 = b.description;
        break;
      case 'value':
        value1 = a.value;
        value2 = b.value;
        break;
      default:
        value1 = a.deadline;
        value2 = b.deadline;
    }

    return [value1, value2];
  };

  if (filteredPayments.length === 0) {
    return <p>No payments found at the moment.</p>;
  }

  const columns = [
    { key: 'address', label: 'Address', className: 'text-left' },
    { key: 'name', label: 'Name', className: 'text-left' },
    { key: 'deadline', label: 'Deadline', className: 'text-left' },
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
                  <tr
                    key={index}
                    className={`border-b ${(index + 1) % 2 === 0 ? 'bg-gray-50' : 'bg-white'}`}
                  >
                    <td className="py-2 px-4">
                      <AccountAddress address={payment.address} />
                    </td>
                    <td className="py-2 px-4">{payment.name}</td>
                    <td className="py-2 px-4">{payment.deadline}</td>
                    <td className="py-2 px-4">
                      <AccountAddress address={payment.payee} />
                    </td>
                    <td className="py-2 px-4">{payment.description}</td>
                    <td className="py-2 px-4 text-right">
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
