import { gql, useQuery } from '@apollo/client';
import clsx from 'clsx';
import { FC } from 'react';
import { Link } from 'react-router-dom';
import Page from '../../../ui/Page/Page';
import TransactionsTable from '../../../ui/UserTransactionsTable';
import Stats from './Stats';

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
    <Page __deprecated_grayBg>
      <Stats />
      <section className="mt-2 overflow-x-auto">
        <Transactions />
      </section>
      <div className="flex p-4 items-center justify-center">
        <Link
          to="/transactions"
          className={clsx(
            'rounded-md bg-primary-500',
            'px-3.5 py-2.5',
            'text-sm font-semibold text-white',
            'shadow-sm',
            'hover:bg-primary-600',
            'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2',
            'focus-visible:outline-primary-600',
          )}
        >
          See all transactions
        </Link>
      </div>
    </Page>
  );
};

export default Home;
