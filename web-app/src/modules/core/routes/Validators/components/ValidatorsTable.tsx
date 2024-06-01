import { FC, useState } from 'react';
import clsx from 'clsx';
import { CheckIcon, XMarkIcon, ChevronUpIcon, ChevronDownIcon } from '@heroicons/react/20/solid';
import AccountAddress from '../../../../ui/AccountAddress';
import Money from '../../../../ui/Money';
import { IValidator } from '../../../../interface/Validator.interface';

interface ValidatorsTableProps {
  validators: IValidator[];
}

type SortOrder = 'asc' | 'desc';

const ValidatorsTable: FC<ValidatorsTableProps> = ({ validators }) => {
  const [sortColumn, setSortColumn] = useState<string>('currentBid');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortOrder('asc');
    }
  };

  const getSortedValidators = () => {
    const sortedValidators = [...validators].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortColumn) {
        case 'address':
          aValue = a.address;
          bValue = b.address;
          break;
        case 'inSet':
          aValue = a.inSet;
          bValue = b.inSet;
          break;
        case 'votingPower':
          aValue = a.votingPower;
          bValue = b.votingPower;
          break;
        case 'grade':
          aValue = a.grade.compliant ? 1 : 0;
          bValue = b.grade.compliant ? 1 : 0;
          if (aValue === bValue) {
            aValue = a.grade.proposedBlocks - a.grade.failedBlocks;
            bValue = b.grade.proposedBlocks - b.grade.failedBlocks;
          }
          break;
        case 'vouches':
          aValue = a.vouches.length;
          bValue = b.vouches.length;
          break;
        case 'currentBid':
          aValue = a.currentBid.currentBid;
          bValue = b.currentBid.currentBid;
          break;
        case 'balance':
          aValue = Number(a.account.balance);
          bValue = Number(b.account.balance);
          break;
        case 'unlocked':
          aValue = a.account.slowWallet ? Number(a.account.slowWallet.unlocked) : 0;
          bValue = b.account.slowWallet ? Number(b.account.slowWallet.unlocked) : 0;
          break;
        default:
          aValue = a.address;
          bValue = b.address;
      }

      if (aValue === bValue) {
        return a.address.localeCompare(b.address);
      }

      return aValue < bValue ? -1 : 1;
    });

    if (sortOrder === 'asc') {
      sortedValidators.reverse();
    }

    return sortedValidators;
  };

  const sortedValidators = getSortedValidators();

  return (
    <div className="overflow-x-auto">
      <div className="inline-block min-w-full py-2 align-middle px-2">
        <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
          <table className="min-w-full divide-y divide-gray-300">
            <thead className="bg-gray-50">
              <tr
                className={clsx(
                  'divide-x divide-gray-200',
                  'text-left text-sm font-semibold text-gray-900 text-center',
                )}
              >
                <th
                  scope="col"
                  className="py-3 px-2 cursor-pointer"
                  onClick={() => handleSort('address')}
                >
                  Address
                  {sortColumn === 'address' &&
                    (sortOrder === 'asc' ? (
                      <ChevronUpIcon className="w-4 h-4 inline" />
                    ) : (
                      <ChevronDownIcon className="w-4 h-4 inline" />
                    ))}
                </th>
                <th
                  scope="col"
                  className="py-3 px-2 cursor-pointer"
                  onClick={() => handleSort('inSet')}
                >
                  In Set
                  {sortColumn === 'inSet' &&
                    (sortOrder === 'asc' ? (
                      <ChevronUpIcon className="w-4 h-4 inline" />
                    ) : (
                      <ChevronDownIcon className="w-4 h-4 inline" />
                    ))}
                </th>
                <th
                  scope="col"
                  className="py-3 px-2 cursor-pointer"
                  onClick={() => handleSort('votingPower')}
                >
                  Voting Power
                  {sortColumn === 'votingPower' &&
                    (sortOrder === 'asc' ? (
                      <ChevronUpIcon className="w-4 h-4 inline" />
                    ) : (
                      <ChevronDownIcon className="w-4 h-4 inline" />
                    ))}
                </th>
                <th
                  scope="col"
                  className="py-3 px-2 cursor-pointer"
                  onClick={() => handleSort('grade')}
                >
                  Grade
                  {sortColumn === 'grade' &&
                    (sortOrder === 'asc' ? (
                      <ChevronUpIcon className="w-4 h-4 inline" />
                    ) : (
                      <ChevronDownIcon className="w-4 h-4 inline" />
                    ))}
                </th>
                <th
                  scope="col"
                  className="py-3 px-2 cursor-pointer"
                  onClick={() => handleSort('vouches')}
                >
                  Active Vouches
                  {sortColumn === 'vouches' &&
                    (sortOrder === 'asc' ? (
                      <ChevronUpIcon className="w-4 h-4 inline" />
                    ) : (
                      <ChevronDownIcon className="w-4 h-4 inline" />
                    ))}
                </th>
                <th
                  scope="col"
                  className="py-3 px-2 text-right cursor-pointer"
                  onClick={() => handleSort('currentBid')}
                >
                  Current Bid (Expiration Epoch)
                  {sortColumn === 'currentBid' &&
                    (sortOrder === 'asc' ? (
                      <ChevronUpIcon className="w-4 h-4 inline" />
                    ) : (
                      <ChevronDownIcon className="w-4 h-4 inline" />
                    ))}
                </th>
                <th
                  scope="col"
                  className="py-3 px-2 text-right cursor-pointer"
                  onClick={() => handleSort('balance')}
                >
                  Balance
                  {sortColumn === 'balance' &&
                    (sortOrder === 'asc' ? (
                      <ChevronUpIcon className="w-4 h-4 inline" />
                    ) : (
                      <ChevronDownIcon className="w-4 h-4 inline" />
                    ))}
                </th>
                <th
                  scope="col"
                  className="py-3 px-2 text-right cursor-pointer"
                  onClick={() => handleSort('unlocked')}
                >
                  Unlocked
                  {sortColumn === 'unlocked' &&
                    (sortOrder === 'asc' ? (
                      <ChevronUpIcon className="w-4 h-4 inline" />
                    ) : (
                      <ChevronDownIcon className="w-4 h-4 inline" />
                    ))}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {sortedValidators.map((validator) => (
                <tr
                  key={validator.address}
                  className={clsx(
                    'divide-x divide-gray-200',
                    'whitespace-nowrap text-sm text-gray-500 even:bg-gray-50 text-center',
                  )}
                >
                  <td className="px-2 py-2 pl-3">
                    <AccountAddress address={validator.address} />
                  </td>
                  <td className="px-2 py-2">
                    {validator.inSet ? (
                      <CheckIcon className="w-5 h-5 text-green-500 inline" />
                    ) : (
                      <XMarkIcon className="w-5 h-5 text-red-500 inline" />
                    )}
                  </td>
                  <td className="px-2 py-2">{Number(validator.votingPower).toLocaleString()}</td>
                  <td className="px-2 py-2">
                    {validator.grade.compliant ? (
                      <CheckIcon className="w-5 h-5 text-green-500 inline" />
                    ) : (
                      <XMarkIcon className="w-5 h-5 text-red-500 inline" />
                    )}
                    {`${validator.grade.proposedBlocks.toLocaleString()} / ${validator.grade.failedBlocks.toLocaleString()}`}
                  </td>
                  <td className="px-2 py-2 text-center">
                    {validator.vouches.length.toLocaleString()}
                  </td>
                  <td className="px-2 py-2 font-mono text-right">
                    {`${validator.currentBid.currentBid.toLocaleString()} (${validator.currentBid.expirationEpoch.toLocaleString()})`}
                  </td>
                  <td className="px-2 py-2 font-mono text-right">
                    <Money>{Number(validator.account.balance)}</Money>
                  </td>
                  <td className="px-2 py-2 font-mono text-right">
                    {validator.account.slowWallet ? (
                      <Money>{Number(validator.account.slowWallet.unlocked)}</Money>
                    ) : (
                      ''
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ValidatorsTable;
