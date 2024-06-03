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
        !transaction.success && 'bg-red-100',
        'whitespace-nowrap text-sm font-medium text-gray-900 border-b border-[#E5E5E5]',
      )}
    >
      <td className="px-6 py-4">
        <Link
          to={`/transactions/${transaction.version}`}
          className="text-[#CD3B42] hover:text-blue-900 hover:underline font-normal"
        >
          {transaction.version.toLocaleString()}
        </Link>
      </td>
      <td className="px-6 py-4 flex flex-row gap-1.5 items-center">
        <AccountAddress address={transaction.sender} />
      </td>
      <td className="px-6 py-4">
        <span className="font-mono">
          <span className="text-red-500">{transaction.moduleAddress}</span>
          {`::${transaction.moduleName}::`}
          <span className="text-blue-500">{transaction.functionName}</span>
        </span>
      </td>
      <td className="px-6 py-4 text-sm font-normal text-right">{formatDistanceToNow(age)}</td>
    </tr>
  );
};

export default UserTransactionRow;
