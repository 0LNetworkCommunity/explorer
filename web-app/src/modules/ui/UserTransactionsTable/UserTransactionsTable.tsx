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
    <div className="mt-2 flow-root">
      <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
        <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
          <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
            <table className="min-w-full divide-y divide-gray-300">
              <thead className="bg-gray-50">
                <tr className="text-sm font-semibold text-gray-900 text-left">
                  <th scope="col" className="px-3 py-2">
                    Version
                  </th>
                  <th scope="col" className="px-3 py-2">
                    Sender
                  </th>
                  <th scope="col" className="px-3 py-2">
                    Method
                  </th>
                  <th scope="col" className="px-3 py-2 text-right">
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
      </div>
    </div>
  );
};

export default TransactionsTable;
