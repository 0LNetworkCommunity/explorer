import { FC } from 'react';
import Page from '../../../ui/Page';
import AccountsStats from './components/AccountsStats';
import AccountsTables from './components/AccountsTables';

const Accounts: FC = () => {
  return (
    <Page>
      <h1 className="font-space-grotesk text-3xl md:text-4xl font-medium leading-[44px] tracking-[-0.02em] text-left mt-6 mb-6">
        Accounts
      </h1>
      <section className="my-2 flow-root">
        <AccountsStats />
        <AccountsTables />
      </section>
    </Page>
  );
};

export default Accounts;
