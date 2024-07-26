import { FC, useState } from 'react';
import Page from '../../../ui/Page';
import ToggleButton from '../../../ui/ToggleButton';
import CommunityWalletsStats from './components/CommunityWalletsStats';
import CommunityWalletsTable from './components/CommunityWalletsTable';
import PaymentsTable from './components/PaymentsTable';
import DetailsTable from './components/DetailsTable';
import { useQuery } from '@apollo/client';
import {
  GET_COMMUNITY_WALLETS,
  GET_COMMUNITY_WALLETS_PAYMENTS,
  GET_COMMUNITY_WALLETS_DETAILS,
} from './queries';

const CommunityWallets: FC = () => {
  const [activeView, setActiveView] = useState<string>('wallets');
  const { data: communityWalletsRes } = useQuery(GET_COMMUNITY_WALLETS);
  const { data: paymentsRes } = useQuery(GET_COMMUNITY_WALLETS_PAYMENTS);
  const { data: detailsRes } = useQuery(GET_COMMUNITY_WALLETS_DETAILS);

  const communityWallets = communityWalletsRes?.getCommunityWallets || [];
  const payments = paymentsRes?.getCommunityWalletsPayments || [];
  const details = detailsRes?.getCommunityWalletsDetails || [];

  console.log(payments);

  const toggleOptions = [
    { label: 'Wallets', value: 'wallets' },
    { label: 'Details', value: 'details' },
    { label: 'Paid', value: 'paid' },
    { label: 'Pending', value: 'pending' },
    { label: 'Vetoed', value: 'vetoed' },
  ];

  return (
    <Page>
      <h1 className="font-space-grotesk text-3xl md:text-4xl font-medium leading-[44px] tracking-[-0.02em] text-left mt-6 mb-6">
        Community Wallets
      </h1>
      <section className="my-2 flow-root">
        <CommunityWalletsStats />
        <div className="py-8">
          <ToggleButton options={toggleOptions} activeValue={activeView} onToggle={setActiveView} />
          <>
            <div style={{ display: activeView === 'wallets' ? 'block' : 'none' }}>
              <CommunityWalletsTable wallets={communityWallets} />
            </div>
            <div style={{ display: activeView === 'paid' ? 'block' : 'none' }}>
              <PaymentsTable payments={payments} status="paid" />
            </div>
            <div style={{ display: activeView === 'pending' ? 'block' : 'none' }}>
              <PaymentsTable payments={payments} status="pending" />
            </div>
            <div style={{ display: activeView === 'vetoed' ? 'block' : 'none' }}>
              <PaymentsTable payments={payments} status="vetoed" />
            </div>
            <div style={{ display: activeView === 'details' ? 'block' : 'none' }}>
              <DetailsTable details={details} />
            </div>
          </>
        </div>
      </section>
    </Page>
  );
};

export default CommunityWallets;
