import React, { useState } from 'react';
import PaymentsTable from './PaymentsTable';
import { ICommunityWalletPayments } from '../../../../interface/CommunityWallets.interface';

interface TransactionsProps {
  payments: ICommunityWalletPayments[];
}

const Transactions: React.FC<TransactionsProps> = ({ payments }) => {
  const [selectedStatus, setSelectedStatus] = useState<string>('paid');

  return (
    <div>
      <div className="flex justify-left m-4">
        <label className="mr-6">
          <input
            type="radio"
            name="status"
            value="paid"
            checked={selectedStatus === 'paid'}
            onChange={() => setSelectedStatus('paid')}
          />
          <span className="ml-2">Paid</span>
        </label>
        <label className="mr-6">
          <input
            type="radio"
            name="status"
            value="pending"
            checked={selectedStatus === 'pending'}
            onChange={() => setSelectedStatus('pending')}
          />
          <span className="ml-2">Pending</span>
        </label>
        <label>
          <input
            type="radio"
            name="status"
            value="vetoed"
            checked={selectedStatus === 'vetoed'}
            onChange={() => setSelectedStatus('vetoed')}
          />
          <span className="ml-2">Vetoed</span>
        </label>
      </div>

      <div style={{ display: selectedStatus === 'paid' ? 'block' : 'none' }}>
        <PaymentsTable payments={payments} status="paid" />
      </div>
      <div style={{ display: selectedStatus === 'pending' ? 'block' : 'none' }}>
        <PaymentsTable payments={payments} status="pending" />
      </div>
      <div style={{ display: selectedStatus === 'vetoed' ? 'block' : 'none' }}>
        <PaymentsTable payments={payments} status="vetoed" />
      </div>
    </div>
  );
};

export default Transactions;
