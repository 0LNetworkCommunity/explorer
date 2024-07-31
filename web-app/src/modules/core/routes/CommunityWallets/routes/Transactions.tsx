import { useState } from 'react';
import { gql, useQuery } from '@apollo/client';

import PaymentsTable from '../components/PaymentsTable';
import { PaymentStatus } from '../components/types';
import { ICommunityWalletPayments } from '../../../../interface/CommunityWallets.interface';

const GET_COMMUNITY_WALLETS_PAYMENTS = gql`
  query GetCommunityWalletsPayments {
    getCommunityWalletsPayments {
      address
      name
      paid {
        deadline
        payee
        description
        value
        status
      }
      pending {
        deadline
        payee
        description
        value
        status
      }
      vetoed {
        deadline
        payee
        description
        value
        status
      }
    }
  }
`;

const Transactions = () => {
  const [selectedStatus, setSelectedStatus] = useState(PaymentStatus.Paid);
  const { data } = useQuery<{
    getCommunityWalletsPayments: ICommunityWalletPayments[];
  }>(GET_COMMUNITY_WALLETS_PAYMENTS);

  const payments = data?.getCommunityWalletsPayments ?? [];

  return (
    <div>
      <div className="flex justify-left m-4">
        <label className="mr-6">
          <input
            type="radio"
            name="status"
            value="paid"
            checked={selectedStatus === PaymentStatus.Paid}
            onChange={() => setSelectedStatus(PaymentStatus.Paid)}
          />
          <span className="ml-2">Paid</span>
        </label>
        <label className="mr-6">
          <input
            type="radio"
            name="status"
            value="pending"
            checked={selectedStatus === PaymentStatus.Pending}
            onChange={() => setSelectedStatus(PaymentStatus.Pending)}
          />
          <span className="ml-2">Pending</span>
        </label>
        <label>
          <input
            type="radio"
            name="status"
            value="vetoed"
            checked={selectedStatus === PaymentStatus.Vetoed}
            onChange={() => setSelectedStatus(PaymentStatus.Vetoed)}
          />
          <span className="ml-2">Vetoed</span>
        </label>
      </div>

      <div style={{ display: selectedStatus === PaymentStatus.Paid ? 'block' : 'none' }}>
        <PaymentsTable payments={payments} status={PaymentStatus.Paid} />
      </div>
      <div style={{ display: selectedStatus === PaymentStatus.Pending ? 'block' : 'none' }}>
        <PaymentsTable payments={payments} status={PaymentStatus.Pending} />
      </div>
      <div style={{ display: selectedStatus === PaymentStatus.Vetoed ? 'block' : 'none' }}>
        <PaymentsTable payments={payments} status={PaymentStatus.Vetoed} />
      </div>
    </div>
  );
};

export default Transactions;
