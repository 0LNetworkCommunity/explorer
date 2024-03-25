import { FC, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Types } from 'aptos';

import useAptos from '../../../../aptos';
import TransactionTable from '../../../../ui/TransactionsTable';

const Transactions: FC = () => {
  const { accountAddress } = useParams();
  const aptos = useAptos();
  const [transactions, setTransaction] = useState<Types.Transaction[]>();

  useEffect(() => {
    const load = async () => {
      const transactions = await aptos.getAccountTransactions(`0x${accountAddress!}`);
      const reversedTransactions = transactions.reverse();
      setTransaction(reversedTransactions);
    };
    load();
  }, [accountAddress, aptos]);

  if (transactions) {
    return <TransactionTable transactions={transactions} />;
  }

  return null;
};

export default Transactions;
