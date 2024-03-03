import { FC } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Link } from 'react-router-dom';
import clsx from 'clsx';
import AccountAddress from '../AccountAddress';

interface Props {
  transaction: {
    version: number;
    timestamp: number;
    sender: string;
    moduleAddress: string;
    moduleName: string;
    functionName: string;
    success: boolean;
  };
}

const UserTransactionRow: FC<Props> = ({ transaction }) => {
  const age = new Date(transaction.timestamp / 1_000);
  return (
    <tr
      className={clsx(
        'whitespace-nowrap text-sm font-medium text-gray-900',
        !transaction.success && 'bg-red-100',
      )}
    >
      <td className="py-2 px-3">
        <Link
          to={`/transactions/${transaction.version}`}
          className="text-blue-600 hover:text-blue-900 hover:underline"
        >
          {transaction.version.toLocaleString()}
        </Link>
      </td>
      <td className="px-3 py-2">
        <AccountAddress address={transaction.sender} />
      </td>
      <td className="px-3 py-2">
        <span className="font-mono">
          <span className="text-red-500">{transaction.moduleAddress}</span>
          {`::${transaction.moduleName}::`}
          <span className="text-blue-500">{transaction.functionName}</span>
        </span>
      </td>
      <td className="px-3 py-2 text-right">{formatDistanceToNow(age)}</td>
    </tr>
  );
};

export default UserTransactionRow;
