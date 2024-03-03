import { gql, useQuery } from '@apollo/client';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/20/solid';
import clsx from 'clsx';
import { FC } from 'react';
import { NavLink, useSearchParams } from 'react-router-dom';
import Page from '../../../ui/Page/Page';
import UserTransactionRow from '../../../ui/UserTransactionsTable/UserTransactionRow';

const ITEM_PER_PAGE = 20;

const GET_USER_TRANSACTIONS = gql`
  query GetUserTransactions($limit: Int!, $offset: Int!) {
    userTransactions(limit: $limit, offset: $offset, order: "DESC") {
      size
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

const TransactionsPage: FC = () => {
  const [searchParams] = useSearchParams();
  const page = parseInt(searchParams.get('page') ?? '1', 10);

  const { data } = useQuery<{
    userTransactions: {
      size: number;
      items: {
        version: number;
        moduleAddress: string;
        moduleName: string;
        functionName: string;
        timestamp: number;
        sender: string;
        success: boolean;
      }[];
    };
  }>(GET_USER_TRANSACTIONS, {
    variables: {
      limit: ITEM_PER_PAGE,
      offset: (page - 1) * ITEM_PER_PAGE,
    },
  });

  if (!data) {
    return <Page __deprecated_grayBg />;
  }

  const pageCount = Math.ceil(data.userTransactions.size / ITEM_PER_PAGE);
  let pages: (null | number)[] = new Array(pageCount).fill(0).map((_, index) => index + 1);

  pages = pages.slice(Math.max(page - 3, 0), page + 2);

  if (pages[0] !== 1) {
    pages.unshift(null);
    pages.unshift(1);
  }
  if (pages[pages.length - 1] !== pageCount) {
    pages.push(null);
    pages.push(pageCount);
  }

  return (
    <Page>
      <div className="mt-2 flow-root overflow-x-auto">
        <div className="inline-block min-w-full py-1 align-middle px-1">
          <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
            <table className="min-w-full divide-y divide-gray-300">
              <thead className="bg-gray-50 text-left text-sm text-gray-900">
                <tr>
                  <th scope="col" className="px-3 py-2 font-normal">
                    Version
                  </th>
                  <th scope="col" className="px-3 py-2 font-normal">
                    Sender
                  </th>
                  <th scope="col" className="px-3 py-2 font-normal">
                    Method
                  </th>
                  <th scope="col" className="px-3 py-2 font-normal text-right">
                    Age
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {data.userTransactions.items.map((transaction) => (
                  <UserTransactionRow key={transaction.version} transaction={transaction} />
                ))}
              </tbody>
            </table>

            <div className="flex items-center justify-between border-t border-gray-200 bg-white px-2 py-2">
              <div className="flex flex-1 justify-between sm:hidden">
                <NavLink
                  to={`/transactions?page=${page - 1}`}
                  className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Previous
                </NavLink>
                <NavLink
                  to={`/transactions?page=${page + 1}`}
                  className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Next
                </NavLink>
              </div>
              <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Showing{' '}
                    <span className="font-medium">
                      {((page - 1) * ITEM_PER_PAGE + 1).toLocaleString()}
                    </span>{' '}
                    to{' '}
                    <span className="font-medium">
                      {((page - 1) * ITEM_PER_PAGE + ITEM_PER_PAGE).toLocaleString()}
                    </span>{' '}
                    of{' '}
                    <span className="font-medium">
                      {data.userTransactions.size.toLocaleString()}
                    </span>{' '}
                    results
                  </p>
                </div>
                <div>
                  <nav
                    className="isolate inline-flex -space-x-px rounded-md shadow-sm"
                    aria-label="Pagination"
                  >
                    <NavLink
                      to={`/transactions?page=${page - 1}`}
                      className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0"
                    >
                      <span className="sr-only">Previous</span>
                      <ChevronLeftIcon className="h-5 w-5" aria-hidden="true" />
                    </NavLink>

                    {pages.map((it, index) => {
                      if (it === null) {
                        return (
                          <span
                            key={`void-${index}`}
                            className={clsx(
                              'relative inline-flex items-center',
                              'px-4 py-2',
                              'text-sm font-semibold text-gray-700',
                              'ring-1 ring-inset ring-gray-300 focus:outline-offset-0',
                            )}
                          >
                            ...
                          </span>
                        );
                      }

                      return (
                        <NavLink
                          key={it}
                          to={`/transactions?page=${it}`}
                          className={clsx(
                            'relative inline-flex items-center',
                            'px-4 py-2',
                            'text-sm font-semibold text-gray-900',
                            'ring-1 ring-inset ring-gray-300',
                            'focus:z-20 focus:outline-offset-0',

                            page === it
                              ? 'z-10 bg-primary-600 text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600'
                              : 'hover:bg-gray-50',
                          )}
                        >
                          {it.toLocaleString()}
                        </NavLink>
                      );
                    })}

                    <NavLink
                      to={`/transactions?page=${page + 1}`}
                      className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0"
                    >
                      <span className="sr-only">Next</span>
                      <ChevronRightIcon className="h-5 w-5" aria-hidden="true" />
                    </NavLink>
                  </nav>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Page>
  );
};

export default TransactionsPage;
