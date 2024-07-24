import { FC } from 'react';
import Page from '../../../ui/Page';
import CommunityWalletsTable from './components/CommunityWalletsTable';

const CommunityWallets: FC = () => {
  return (
    <Page>
      <h1 className="font-space-grotesk text-3xl md:text-4xl font-medium leading-[44px] tracking-[-0.02em] text-left mt-6 mb-6">
        Community Wallets
      </h1>
      <section className="my-2 flow-root">
        <div className="py-8">
          <CommunityWalletsTable />
        </div>
      </section>
    </Page>
  );
};

export default CommunityWallets;
