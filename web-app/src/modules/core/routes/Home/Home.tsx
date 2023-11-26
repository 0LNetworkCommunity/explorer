import { FC, useEffect, useState } from "react";
import Page from "../../../ui/Page/Page";
import Stats from "./Stats";
import useAptos from "../../../aptos";
import { Types } from "aptos";
import TransactionTable from "../../../ui/TransactionsTable";
import { Link } from "react-router-dom";

const Transactions: FC = () => {
  const aptos = useAptos();
  const [transactions, setTransactions] = useState<Types.Transaction[]>([]);

  useEffect(() => {
    const load = async () => {
      const transactions = await aptos.getTransactions(
        { limit: 10 }
      );
      transactions.reverse();
      setTransactions(transactions);
    };
    load();
  }, []);

  return (
    <TransactionTable transactions={transactions} />
  );
};

const Home: FC = () => {
  return (
    <Page>
      <Stats />
      <section className="mt-8">
        <h2 className="text-xl font-bold text-slate-900">Transactions</h2>
        <Transactions />

        <div className="hidden flex p-4 items-center justify-center">
          <Link
            to="/transactions"
            className="rounded-md bg-primary-500 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
          >
            See all transactions
          </Link>
        </div>
      </section>
    </Page>
  );
};

export default Home;
