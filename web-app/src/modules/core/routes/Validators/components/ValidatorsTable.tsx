import { FC, useState } from 'react';
import clsx from 'clsx';
import { ArrowUpIcon, ArrowDownIcon } from '@heroicons/react/20/solid';
import AccountAddress from '../../../../ui/AccountAddress';
import Money from '../../../../ui/Money';
import { IValidator } from '../../../../interface/Validator.interface';

interface ValidatorsTableProps {
  validators?: IValidator[];
}

type SortOrder = 'asc' | 'desc';

const ValidatorsTable: FC<ValidatorsTableProps> = ({ validators }) => {
  const [sortColumn, setSortColumn] = useState<string>('index');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [isActive, setIsActive] = useState(true);

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortOrder('asc');
    }
  };

  const getFilteredValidators = () => {
    return validators
      ? validators.filter((validator) => {
          if (isActive) {
            return validator.inSet;
          } else {
            return !validator.inSet;
          }
        })
      : [];
  };

  const getSortedValidators = (filteredValidators: IValidator[]) => {
    const sortedValidators = [...filteredValidators].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortColumn) {
        case 'address':
          aValue = a.address;
          bValue = b.address;
          break;
        case 'index':
          aValue = Number(a.index);
          bValue = Number(b.index);
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
          aValue = a.currentBid ? a.currentBid.currentBid : 0;
          bValue = b.currentBid ? b.currentBid.currentBid : 0;
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

  let filteredValidators;
  let sortedValidators;
  if (validators) {
    filteredValidators = getFilteredValidators();
    sortedValidators = getSortedValidators(filteredValidators);
  }

  function handleSetActive(boo: boolean) {
    if (isActive && sortColumn == 'index') {
      setSortColumn('vouches');
      setSortOrder('asc');
    }
    setIsActive(boo);
  }

  return (
    <div className="pt-8 pb-8">
      <div className="inline-flex border border-gray-200 rounded-md overflow-hidden shadow-sm mb-6">
        <button
          onClick={() => handleSetActive(true)}
          className={clsx(
            'px-4 py-3',
            isActive ? 'bg-[var(--Colors-Background-bg-active,#FAFAFA)]' : 'bg-white',
            'border-r border-gray-200',
          )}
        >
          <span>Active</span>
        </button>
        <button
          onClick={() => handleSetActive(false)}
          className={clsx(
            'px-4 py-3',
            !isActive ? 'bg-[var(--Colors-Background-bg-active,#FAFAFA)]' : 'bg-white',
          )}
        >
          Inactive
        </button>
      </div>
      <div className="overflow-x-auto">
        <div className="inline-block min-w-full py-2 align-middle">
          <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr className="text-left text-sm">
                  <th
                    scope="col"
                    className="text-xs cursor-pointer font-medium py-3 px-6 text-[#525252] whitespace-nowrap"
                    onClick={() => handleSort('address')}
                  >
                    Address
                    {sortColumn === 'address' &&
                      (sortOrder === 'asc' ? (
                        <ArrowUpIcon className="w-4 h-4 inline" />
                      ) : (
                        <ArrowDownIcon className="w-4 h-4 inline" />
                      ))}
                  </th>
                  {isActive && (
                    <th
                      scope="col"
                      className="text-xs cursor-pointer font-medium py-3 px-6 text-[#525252] whitespace-nowrap"
                      onClick={() => handleSort('index')}
                    >
                      Set Position
                      {sortColumn === 'index' &&
                        (sortOrder === 'asc' ? (
                          <ArrowUpIcon className="w-4 h-4 inline" />
                        ) : (
                          <ArrowDownIcon className="w-4 h-4 inline" />
                        ))}
                    </th>
                  )}
                  <th
                    scope="col"
                    className="text-xs cursor-pointer font-medium py-3 px-6 text-[#525252]"
                    onClick={() => handleSort('vouches')}
                  >
                    Active Vouches
                    {sortColumn === 'vouches' &&
                      (sortOrder === 'asc' ? (
                        <ArrowUpIcon className="w-4 h-4 inline" />
                      ) : (
                        <ArrowDownIcon className="w-4 h-4 inline" />
                      ))}
                  </th>
                  <th
                    scope="col"
                    className="text-xs cursor-pointer font-medium py-3 px-6 text-[#525252] text-right"
                    onClick={() => handleSort('currentBid')}
                  >
                    Current Bid (Expiration Epoch)
                    {sortColumn === 'currentBid' &&
                      (sortOrder === 'asc' ? (
                        <ArrowUpIcon className="w-4 h-4 inline" />
                      ) : (
                        <ArrowDownIcon className="w-4 h-4 inline" />
                      ))}
                  </th>
                  <th
                    scope="col"
                    className="text-xs cursor-pointer font-medium py-3 px-6 text-[#525252] text-right"
                    onClick={() => handleSort('balance')}
                  >
                    Balance
                    {sortColumn === 'balance' &&
                      (sortOrder === 'asc' ? (
                        <ArrowUpIcon className="w-4 h-4 inline" />
                      ) : (
                        <ArrowDownIcon className="w-4 h-4 inline" />
                      ))}
                  </th>
                  <th
                    scope="col"
                    className="text-xs cursor-pointer font-medium py-3 px-6 text-[#525252] text-right"
                    onClick={() => handleSort('unlocked')}
                  >
                    Unlocked
                    {sortColumn === 'unlocked' &&
                      (sortOrder === 'asc' ? (
                        <ArrowUpIcon className="w-4 h-4 inline" />
                      ) : (
                        <ArrowDownIcon className="w-4 h-4 inline" />
                      ))}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {sortedValidators
                  ? sortedValidators.map((validator) => (
                      <tr
                        key={validator.address}
                        className={clsx('whitespace-nowrap text-sm text-gray-500 text-center')}
                      >
                        <td className="px-2 md:px-4 lg:px-6 py-4">
                          <AccountAddress address={validator.address} />
                        </td>
                        {isActive && (
                          <td className="px-2 md:px-4 lg:px-6 py-4 text-center">
                            {Number(validator.index) + 1}
                          </td>
                        )}
                        <td className="px-2 md:px-4 lg:px-6 py-4 text-center">
                          {validator.vouches.length.toLocaleString()}
                        </td>
                        <td className="px-2 md:px-4 lg:px-6 py-4 font-mono text-right">
                          {`${
                            validator.currentBid && validator.currentBid.currentBid.toLocaleString()
                          } (${
                            validator.currentBid &&
                            validator.currentBid.expirationEpoch.toLocaleString()
                          })`}
                        </td>
                        <td className="px-2 md:px-4 lg:px-6 py-4 font-mono text-right">
                          <Money>{Number(validator.account.balance)}</Money>
                        </td>
                        <td className="px-2 md:px-4 lg:px-6 py-4 font-mono text-right">
                          {validator.account.slowWallet ? (
                            <Money>{Number(validator.account.slowWallet.unlocked)}</Money>
                          ) : (
                            ''
                          )}
                        </td>
                      </tr>
                    ))
                  : Array.from({ length: 10 }).map((_, index) => (
                      <ValidatorSkeletonRow key={index} />
                    ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

const ValidatorSkeletonRow = () => (
  <tr className={clsx('whitespace-nowrap text-sm text-gray-500 text-center')}>
    <td className="px-2 md:px-4 lg:px-6 py-4">
      <div className="animate-pulse bg-gray-200 h-4 w-24 mx-auto rounded"></div>
    </td>
    <td className="px-2 md:px-4 lg:px-6 py-4">
      <div className="animate-pulse bg-gray-200 h-4 w-12 mx-auto rounded"></div>
    </td>
    <td className="px-2 md:px-4 lg:px-6 py-4">
      <div className="animate-pulse bg-gray-200 h-4 w-12 mx-auto rounded"></div>
    </td>
    <td className="px-2 md:px-4 lg:px-6 py-4">
      <div className="animate-pulse bg-gray-200 h-4 w-24 mx-auto rounded"></div>
    </td>
    <td className="px-2 md:px-4 lg:px-6 py-4">
      <div className="animate-pulse bg-gray-200 h-4 w-24 mx-auto rounded"></div>
    </td>
    <td className="px-2 md:px-4 lg:px-6 py-4">
      <div className="animate-pulse bg-gray-200 h-4 w-24 mx-auto rounded"></div>
    </td>
  </tr>
);

export default ValidatorsTable;
