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
        <button onClick={() => navigator.clipboard.writeText(transaction.sender)}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
          >
            <g clip-path="url(#clip0_644_480)">
              <path
                d="M5.33398 10.6666V12.5333C5.33398 13.28 5.33398 13.6534 5.47931 13.9386C5.60714 14.1895 5.81111 14.3935 6.062 14.5213C6.34721 14.6666 6.72058 14.6666 7.46732 14.6666H12.534C13.2807 14.6666 13.6541 14.6666 13.9393 14.5213C14.1902 14.3935 14.3942 14.1895 14.522 13.9386C14.6673 13.6534 14.6673 13.28 14.6673 12.5333V7.46665C14.6673 6.71991 14.6673 6.34654 14.522 6.06133C14.3942 5.81044 14.1902 5.60647 13.9393 5.47864C13.6541 5.33331 13.2807 5.33331 12.534 5.33331H10.6673M3.46732 10.6666H8.53398C9.28072 10.6666 9.65409 10.6666 9.93931 10.5213C10.1902 10.3935 10.3942 10.1895 10.522 9.93863C10.6673 9.65342 10.6673 9.28005 10.6673 8.53331V3.46665C10.6673 2.71991 10.6673 2.34654 10.522 2.06133C10.3942 1.81044 10.1902 1.60647 9.93931 1.47864C9.65409 1.33331 9.28072 1.33331 8.53398 1.33331H3.46732C2.72058 1.33331 2.34721 1.33331 2.062 1.47864C1.81111 1.60647 1.60714 1.81044 1.47931 2.06133C1.33398 2.34654 1.33398 2.71991 1.33398 3.46665V8.53331C1.33398 9.28005 1.33398 9.65342 1.47931 9.93863C1.60714 10.1895 1.81111 10.3935 2.062 10.5213C2.34721 10.6666 2.72058 10.6666 3.46732 10.6666Z"
                stroke="#A3A3A3"
                stroke-width="1.33333"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </g>
            <defs>
              <clipPath id="clip0_644_480">
                <rect width="16" height="16" fill="white" />
              </clipPath>
            </defs>
          </svg>
        </button>
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
