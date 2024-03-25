import { FC, useState } from 'react';
import { Types } from 'aptos';
import BlockMetadataTransactionRow from './BlockMetadataTransactionRow';
import StateCheckpointTransactionRow from './StateCheckpointTransactionRow';
import UserTransactionRow from './UserTransactionRow';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/20/solid';
import clsx from 'clsx';

type TransactionCellProps = {
  transaction: Types.Transaction;
  address?: string;
};

function SequenceNumberCell({ transaction }: TransactionCellProps) {
  return (
    <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
      {'sequence_number' in transaction && transaction.sequence_number}
    </td>
  );
}

const TransactionCells = Object.freeze({
  sequenceNum: SequenceNumberCell,
});

type TransactionColumn = keyof typeof TransactionCells;

interface TransactionRowProps {
  transaction: Types.Transaction;
}

const TransactionRow: FC<TransactionRowProps> = ({ transaction }) => {
  switch (transaction.type) {
    case 'block_metadata_transaction':
      return (
        <BlockMetadataTransactionRow transaction={transaction as Types.BlockMetadataTransaction} />
      );
    case 'state_checkpoint_transaction':
      return (
        <StateCheckpointTransactionRow
          transaction={transaction as Types.StateCheckpointTransaction}
        />
      );
    case 'user_transaction':
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
};

interface Props {
  transactions: Types.Transaction[];
  columns?: TransactionColumn[];
}

const TransactionsTable: FC<Props> = ({ transactions }) => {
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 20;
  const maxPageNumDisplayed = 5;

  const pageCount = Math.ceil(transactions.length / itemsPerPage);

  const transactionCount = transactions.length;

  const currentTransactions = transactions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  const setPage = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const startNumber = (currentPage - 1) * itemsPerPage + 1;
  const endNumber = Math.min(currentPage * itemsPerPage, transactionCount);

  const renderPaginationButtons = () => {
    const pages = [];

    pages.push(
      <button
        key={1}
        onClick={() => setPage(1)}
        className={clsx(
          'relative inline-flex items-center',
          'px-4 py-2',
          'text-sm font-semibold text-gray-900',
          'ring-1 ring-inset ring-gray-300',
          'focus:z-20 focus:outline-offset-0',
          currentPage === 1 ? 'bg-primary-600 text-white' : 'hover:bg-gray-50',
        )}
      >
        1
      </button>,
    );

    let rangeStart = Math.max(currentPage - 2, 2);
    let rangeEnd = Math.min(currentPage + 2, pageCount - 1);

    if (rangeEnd - rangeStart < maxPageNumDisplayed - 2) {
      if (currentPage - 2 < 2) {
        rangeEnd = Math.min(rangeStart + maxPageNumDisplayed - 3, pageCount - 1);
      } else {
        rangeStart = Math.max(rangeEnd - maxPageNumDisplayed + 3, 2);
      }
    }

    if (rangeStart > 2) {
      pages.push(
        <span
          key="left-ellipsis"
          className="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-700 ring-1 ring-inset ring-gray-300"
        >
          ...
        </span>,
      );
    }

    for (let i = rangeStart; i <= rangeEnd; i++) {
      pages.push(
        <button
          key={i}
          onClick={() => setPage(i)}
          className={clsx(
            'relative inline-flex items-center',
            'px-4 py-2',
            'text-sm font-semibold text-gray-900',
            'ring-1 ring-inset ring-gray-300',
            'focus:z-20 focus:outline-offset-0',
            i === currentPage ? 'bg-primary-600 text-white' : 'hover:bg-gray-50',
          )}
        >
          {i}
        </button>,
      );
    }

    if (rangeEnd < pageCount - 1) {
      pages.push(
        <span
          key="right-ellipsis"
          className="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-700 ring-1 ring-inset ring-gray-300"
        >
          ...
        </span>,
      );
    }

    if (pageCount > 1) {
      pages.push(
        <button
          key={pageCount}
          onClick={() => setPage(pageCount)}
          className={clsx(
            'relative inline-flex items-center',
            'px-4 py-2',
            'text-sm font-semibold text-gray-900',
            'ring-1 ring-inset ring-gray-300',
            'focus:z-20 focus:outline-offset-0',
            currentPage === pageCount ? 'bg-primary-600 text-white' : 'hover:bg-gray-50',
          )}
        >
          {pageCount}
        </button>,
      );
    }

    return pages;
  };

  return (
    <div className="mt-2 flow-root">
      <div className="my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
        <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
          <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
            <table className="min-w-full divide-y divide-gray-300">
              <thead className="bg-gray-50">
                <tr>
                  <th
                    scope="col"
                    className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6"
                  >
                    Version
                  </th>
                  <th
                    scope="col"
                    className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                  >
                    Type
                  </th>
                  <th
                    scope="col"
                    className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                  >
                    Timestamp
                  </th>
                  <th
                    scope="col"
                    className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                  >
                    Sender
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {currentTransactions.map((transaction, index) => (
                  <TransactionRow key={`${index}-${transaction.hash}`} transaction={transaction} />
                ))}
              </tbody>
            </table>
            <div className="flex items-center justify-between border-t border-gray-200 bg-white px-2 py-2">
              <div className="flex flex-1 justify-between sm:hidden">
                <button
                  onClick={() => setPage(currentPage - 1)}
                  disabled={currentPage <= 1}
                  className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage(currentPage + 1)}
                  disabled={currentPage >= pageCount}
                  className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Next
                </button>
              </div>
              <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Showing <span className="font-medium">{startNumber.toLocaleString()}</span> to{' '}
                    <span className="font-medium">{endNumber.toLocaleString()}</span> of{' '}
                    <span className="font-medium">{transactionCount.toLocaleString()}</span> results
                  </p>
                </div>
                <div>
                  <nav
                    className="isolate inline-flex -space-x-px rounded-md shadow-sm"
                    aria-label="Pagination"
                  >
                    <button
                      onClick={() => setPage(currentPage - 1)}
                      disabled={currentPage <= 1}
                      className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0"
                    >
                      <span className="sr-only">Previous</span>
                      <ChevronLeftIcon className="h-5 w-5" aria-hidden="true" />
                    </button>

                    {renderPaginationButtons()}

                    <button
                      onClick={() => setPage(currentPage + 1)}
                      disabled={currentPage >= pageCount}
                      className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0"
                    >
                      <span className="sr-only">Next</span>
                      <ChevronRightIcon className="h-5 w-5" aria-hidden="true" />
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TransactionsTable;
