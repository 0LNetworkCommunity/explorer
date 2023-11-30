import { FC } from "react";
import { Link } from "react-router-dom";
import { gql, useQuery } from "@apollo/client";
import clsx from "clsx";
import Page from "../../../ui/Page/Page";
import Stats from "./Stats";
import TransactionsTable from "../../../ui/TransactionsTable";

const GET_USER_TRANSACTIONS = gql`
  query GetUserTransactions {
    userTransactions(limit: 10, offset: 0, order: "DESC") {
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
    return (
      <TransactionsTable transactions={data.userTransactions.items} />
    );
  }

  return null;
};

const Home: FC = () => {
  return (
    <Page>
      <Stats />
      <section className="mt-8">
        <h2 className="text-xl font-bold text-slate-900">Transactions</h2>
        <Transactions />

        <div className="flex p-4 items-center justify-center">
          <Link
            to="/transactions"
            className={clsx(
              "rounded-md bg-primary-500",
              "px-3.5 py-2.5",
              "text-sm font-semibold text-white",
              "shadow-sm",
              "hover:bg-primary-600",
              "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2",
              "focus-visible:outline-primary-600"
            )}
          >
            See all transactions
          </Link>
        </div>
      </section>
    </Page>
  );
};

export default Home;
