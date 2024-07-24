import { gql, useQuery } from '@apollo/client';
import { FC } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRightIcon } from '@heroicons/react/20/solid';

import Page from '../../../ui/Page/Page';
import TransactionsTable from '../../../ui/UserTransactionsTable';
import Stats from './Stats';
import { OL_DISCORD_URL } from '../../../../contants';

const GET_USER_TRANSACTIONS = gql`
  query GetUserTransactions {
    userTransactions(limit: 20, offset: 0, order: "DESC") {
      items {
        version
        sender
        moduleAddress
        moduleName
        functionName
        timestamp
        success
      }
    }
  }
`;

const Transactions: FC = () => {
  const { data } = useQuery(GET_USER_TRANSACTIONS);

  if (data) {
    return <TransactionsTable transactions={data.userTransactions.items} />;
  }

  return null;
};

const Home: FC = () => {
  return (
    <Page>
      <Stats />
      <section className="mt-2 overflow-x-auto">
        <div className="my-6 px-2	flex flex-row justify-between align-center gap-3">
          <h2 className="text-[#141414] text-xl font-medium">Latest Transactions</h2>
          <Link to="/transactions" className="text-base font-medium text-[#B7353B]">
            View all
          </Link>
        </div>
        <Transactions />
      </section>
    </Page>
  );
};

export default Home;
