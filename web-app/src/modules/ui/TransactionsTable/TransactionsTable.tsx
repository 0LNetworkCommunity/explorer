import { FC } from "react";
import { Types } from "aptos";
import BlockMetadataTransactionRow from "./BlockMetadataTransactionRow";
import StateCheckpointTransactionRow from "./StateCheckpointTransactionRow";
import UserTransactionRow from "./UserTransactionRow";

type TransactionCellProps = {
  transaction: Types.Transaction;
  address?: string;
};

function SequenceNumberCell({transaction}: TransactionCellProps) {
  return (
    <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
      {"sequence_number" in transaction && transaction.sequence_number}
    </td>
  );
}

const TransactionCells = Object.freeze({
  sequenceNum: SequenceNumberCell,
});

type TransactionColumn = keyof typeof TransactionCells;

interface TransactionRowProps {
  transaction: Types.Transaction;
};

const TransactionRow: FC<TransactionRowProps> = ({ transaction }) => {
  switch (transaction.type) {
    case "block_metadata_transaction":
      return <BlockMetadataTransactionRow transaction={transaction as Types.BlockMetadataTransaction} />;
    case "state_checkpoint_transaction":
      return <StateCheckpointTransactionRow transaction={transaction as Types.StateCheckpointTransaction} />;
    case "user_transaction":
      return <UserTransactionRow transaction={transaction as Types.UserTransaction} />;

    default:
      return (
        <tr>
          <td></td>
          <td>{transaction.type}</td>
          <td></td>
          <td></td>
        </tr>
      );
  }
}

interface Props {
  transactions: Types.Transaction[]
  columns?: TransactionColumn[];
}

const TransactionsTable: FC<Props> = ({ transactions }) => {
  return (
      <div className="mt-2 flow-root">
        <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                      Version
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Type
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Timestamp
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Sender
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {transactions.map((transaction, index) => (
                    <TransactionRow key={`${index}-${transaction.hash}`} transaction={transaction} />
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
