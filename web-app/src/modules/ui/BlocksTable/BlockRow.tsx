import { FC } from 'react';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';

import { Types } from 'aptos';

interface Props {
  block: {
    block_height: string;
    block_hash: string;
    block_timestamp: string;
    first_version: string;
    last_version: string;
  };
}

const BlockRow: FC<Props> = ({ block }) => {
  const blockHeight = parseInt(block.block_height, 10);
  const timestamp = parseInt(block.block_timestamp, 10) / 1_000; // Convert microseconds to milliseconds
  const firstVersion = parseInt(block.first_version, 10);
  const lastVersion = parseInt(block.last_version, 10);
  const transactionCount = lastVersion - firstVersion + 1;

  return (
    <tr className="hover:bg-gray-50">
      <td className="whitespace-nowrap px-3 py-2 text-sm text-gray-900">
        <Link
          to={`/blocks/${blockHeight}`}
          className="text-blue-600 hover:text-blue-900 hover:underline font-medium"
        >
          {blockHeight.toLocaleString()}
        </Link>
      </td>
      <td className="whitespace-nowrap px-3 py-2 text-sm text-gray-900">
        <span className="font-mono text-xs">
          {block.block_hash.slice(0, 8)}...{block.block_hash.slice(-6)}
        </span>
      </td>
      <td className="whitespace-nowrap px-3 py-2 text-sm text-gray-900">
        {transactionCount.toLocaleString()}
      </td>
      <td className="whitespace-nowrap px-3 py-2 text-sm text-gray-900">
        <Link
          to={`/transactions/${firstVersion}`}
          className="text-blue-600 hover:text-blue-900 hover:underline"
        >
          {firstVersion.toLocaleString()}
        </Link>
      </td>
      <td className="whitespace-nowrap px-3 py-2 text-sm text-gray-900">
        <Link
          to={`/transactions/${lastVersion}`}
          className="text-blue-600 hover:text-blue-900 hover:underline"
        >
          {lastVersion.toLocaleString()}
        </Link>
      </td>
      <td className="whitespace-nowrap px-3 py-2 text-sm text-gray-900 text-right">
        <span title={new Date(timestamp).toLocaleString()}>
          {formatDistanceToNow(new Date(timestamp), { addSuffix: true })}
        </span>
      </td>
    </tr>
  );
};

export default BlockRow;
