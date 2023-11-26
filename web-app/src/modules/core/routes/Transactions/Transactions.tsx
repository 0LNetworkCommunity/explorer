import { FC } from "react";
import { gql, useQuery } from "@apollo/client";
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/20/solid";
import { NavLink, useSearchParams } from "react-router-dom";
import clsx from "clsx";
import UserTransactionRow from "../../../ui/TransactionsTable/UserTransactionRow";
import Page from "../../../ui/Page/Page";

const ITEM_PER_PAGE = 10;

const GET_USER_TRANSACTIONS = gql`
  query GetUserTransactions($limit: Int!, $offset: Int!) {
    userTransactions(limit: $limit, offset: $offset, order: "DESC") {
      size
      items {
        version
        hash
        sender
        timestamp
      }
    }
  }
`;

const TransactionsPage: FC = () => {
  const [searchParams] = useSearchParams();
  const page = parseInt(searchParams.get("page") ?? "1", 10);

  console.log({
    limit: ITEM_PER_PAGE,
    offset: (page - 1) * ITEM_PER_PAGE,
  });

  const { loading, error, data } = useQuery<{
    userTransactions: {
      size: number;
      items: {
        hash: string;
        version: number;
        timestamp: number;
        sender: string;
      }[];
    };
  }>(GET_USER_TRANSACTIONS, {
    variables: {
      limit: ITEM_PER_PAGE,
      offset: (page - 1) * ITEM_PER_PAGE,
    },
  });

  if (!data) {
    return <Page title="Transactions" />;
  }

  const pages = new Array(Math.ceil(data.userTransactions.size / ITEM_PER_PAGE))
    .fill(0)
    .map((_, index) => index + 1);
  console.log(pages);

  return (
    <Page title="Transactions">
      <div className="mt-2 flow-root">
        <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th
                      scope="col"
                      className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6"
                    >
                      Version
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                    >
                      Timestamp
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                    >
                      Sender
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {data.userTransactions.items.map((transaction, index) => (
                    <UserTransactionRow
                      key={`${index}-${transaction.hash}`}
                      transaction={transaction}
                    />
                  ))}
                </tbody>
              </table>

              <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6">
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
                      Showing <span className="font-medium">1</span> to{" "}
                      <span className="font-medium">10</span> of{" "}
                      <span className="font-medium">
                        {data.userTransactions.size}
                      </span>{" "}
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
                        <ChevronLeftIcon
                          className="h-5 w-5"
                          aria-hidden="true"
                        />
                      </NavLink>

                      {pages.map((it) => (
                        <NavLink
                          key={it}
                          to={`/transactions?page=${it}`}
                          className={clsx(
                            "relative inline-flex items-center",
                            "px-4 py-2",
                            "text-sm font-semibold text-gray-900",
                            "ring-1 ring-inset ring-gray-300",
                            "focus:z-20 focus:outline-offset-0",

                            page === it
                              ? "z-10 bg-primary-600 text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600"
                              : "hover:bg-gray-50"
                          )}
                        >
                          {it}
                        </NavLink>
                      ))}

                      <NavLink
                        to={`/transactions?page=${page + 1}`}
                        className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0"
                      >
                        <span className="sr-only">Next</span>
                        <ChevronRightIcon
                          className="h-5 w-5"
                          aria-hidden="true"
                        />
                      </NavLink>
                    </nav>
                  </div>
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
