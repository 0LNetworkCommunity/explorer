import { FC, useState } from 'react';
import Page from '../../../ui/Page';
import AccountsStats from './components/AccountsStats';
import ToggleButton from '../../../ui/ToggleButton';
import TopAccountsTable from './components/TopAccountsTable';
import CommunityWalletsTable from './components/CommunityWalletsTable';

const Accounts: FC = () => {
  const [activeView, setActiveView] = useState<string>('topAccounts');

  const toggleOptions = [
    { label: 'Top Accounts', value: 'topAccounts' },
    { label: 'Community Wallets', value: 'communityWallets' },
  ];

  return (
    <Page>
      <h1 className="font-space-grotesk text-3xl md:text-4xl font-medium leading-[44px] tracking-[-0.02em] text-left mt-6 mb-6">
        Accounts
      </h1>
      <section className="my-2 flow-root">
        <AccountsStats />
        <div className="py-8">
          <ToggleButton options={toggleOptions} activeValue={activeView} onToggle={setActiveView} />
          {activeView === 'topAccounts' ? <TopAccountsTable /> : <CommunityWalletsTable />}
        </div>
      </section>
    </Page>
  );
};

export default Accounts;
