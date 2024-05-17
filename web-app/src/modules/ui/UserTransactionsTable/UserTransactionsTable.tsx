import { FC } from 'react';
import UserTransactionRow from './UserTransactionRow';

interface Props {
  transactions: {
    version: number;
    timestamp: number;
    sender: string;
    moduleAddress: string;
    moduleName: string;
    functionName: string;
    success: boolean;
  }[];
}

const TransactionsTable: FC<Props> = ({ transactions }) => {
  return (
    <div className="inline-block min-w-full py-2 align-middle px-2">
      <table className="min-w-full">
        <thead className="bg-[#FAFAFA] border-b border-[#E5E5E5]">
          <tr>
            <th scope="col" className="px-6 py-3 text-left font-medium text-xs">
              Version
            </th>
            <th scope="col" className="px-6 py-3 text-left font-medium text-xs">
              From
            </th>
            <th scope="col" className="px-6 py-3 text-left font-medium text-xs">
              Function
            </th>
            <th scope="col" className="px-6 py-3 text-left font-medium text-xs">
              Age
            </th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((transaction) => (
            <UserTransactionRow key={transaction.version} transaction={transaction} />
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default TransactionsTable;
