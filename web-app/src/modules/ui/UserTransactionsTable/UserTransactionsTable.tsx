import { FC } from "react";
import UserTransactionRow from "./UserTransactionRow";

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
      <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
        <table className="min-w-full divide-y divide-gray-300">
          <thead className="bg-gray-50">
            <tr className="text-sm font-semibold text-gray-900 text-left">
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
            {transactions.map((transaction) => (
              <UserTransactionRow
                key={transaction.version}
                transaction={transaction}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TransactionsTable;
