import { gql, useQuery } from '@apollo/client';
import clsx from 'clsx';
import { FC } from 'react';
import { Link } from 'react-router-dom';
import Page from '../../../ui/Page/Page';
import TransactionsTable from '../../../ui/UserTransactionsTable';
import Stats from './Stats';
import { ArrowUpRightIcon } from '@heroicons/react/20/solid';
import { OL_DISCORD_URL } from '../../../../contants';
import NodeMap from '../../../ui/NodeMap';

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
    <>
      <section className="pt-5 lg:pt-20 pb-12 lg:pb-8">
        <div className="max-w-7xl mx-auto px-8">
          <div className="flex flex-col lg:flex-row justify-between gap-6">
            <div className="max-w-max lg:max-w-2xl">
              <h1 className="pb-3 font-medium text-5xl text-[#141414]">0L Network Explorer</h1>
              <p className="text-[#424242] text-base	">
                0L is open, permissionless, and community governed. 0L combines state of the art
                blockchain technology with truly decentralized governance.
              </p>
            </div>
            <a
              href={OL_DISCORD_URL}
              target="_blank"
              className="h-fit px-3.5 py-4 lg-py-3 gap-1.5 text-white bg-[#CD3B42] flex justify-center items-center font-medium rounded-md shadow-sm cursor-pointer hover:bg-red-700 transition-colors duration-150"
            >
              <ArrowUpRightIcon className="h-5 w-5" />
              Join Community
            </a>
          </div>
        </div>
      </section>
      <section>
        <NodeMap />
      </section>
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
    </>
  );
};

export default Home;
