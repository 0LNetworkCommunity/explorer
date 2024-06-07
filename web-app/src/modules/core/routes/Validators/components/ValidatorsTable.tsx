import { FC, useState } from 'react';
import { IValidator } from '../../../../interface/Validator.interface';
import ToggleButton from './ToggleButton';
import SortableTh from './SortableTh';
import ValidatorRow from './ValidatorRow';
import ValidatorRowSkeleton from './ValidatorRowSkeleton';

interface ValidatorsTableProps {
  validators?: IValidator[];
}

type SortOrder = 'asc' | 'desc';

const ValidatorsTable: FC<ValidatorsTableProps> = ({ validators }) => {
  const [sortColumn, setSortColumn] = useState<string>('index');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [previousSortColumn, setPreviousSortColumn] = useState<string>('vouches');
  const [isActive, setIsActive] = useState(true);

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setPreviousSortColumn(sortColumn);
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
      const [aValue, bValue] = getValue(a, b, sortColumn);
      const [aPreviousValue, bPreviousValue] = getValue(a, b, previousSortColumn);

      if (aValue === bValue) {
        if (aPreviousValue === bPreviousValue) {
          return a.address.localeCompare(b.address);
        }
        return aPreviousValue < bPreviousValue ? -1 : 1;
      }

      return aValue < bValue ? -1 : 1;
    });

    if (sortOrder === 'asc') {
      sortedValidators.reverse();
    }

    return sortedValidators;
  };

  const getValue = (a: IValidator, b: IValidator, column: string): [any, any] => {
    let value1: any;
    let value2: any;

    switch (column) {
      case 'address':
        value1 = a.address;
        value2 = b.address;
        break;
      case 'index':
        value1 = Number(a.index);
        value2 = Number(b.index);
        break;
      case 'votingPower':
        value1 = a.votingPower;
        value2 = b.votingPower;
        break;
      case 'grade':
        if (value1 === value2) {
          value1 = a.grade.proposedBlocks - a.grade.failedBlocks;
          value2 = b.grade.proposedBlocks - b.grade.failedBlocks;
        }
        break;
      case 'vouches':
        value1 = a.vouches.length;
        value2 = b.vouches.length;
        break;
      case 'currentBid':
        value1 = a.currentBid ? a.currentBid.currentBid : 0;
        value2 = b.currentBid ? b.currentBid.currentBid : 0;
        break;
      case 'cumulativeShare':
        value1 = Number(a.account.balance);
        value2 = Number(b.account.balance);
        break;
      case 'location':
        value1 = a.country ? a.country + a.city : '';
        value2 = b.country ? b.country + b.city : '';
        break;
      case 'balance':
        value1 = Number(a.account.balance);
        value2 = Number(b.account.balance);
        break;
      case 'unlocked':
        value1 = a.account.slowWallet ? Number(a.account.slowWallet.unlocked) : 0;
        value2 = b.account.slowWallet ? Number(b.account.slowWallet.unlocked) : 0;
        break;
      default:
        value1 = a.address;
        value2 = b.address;
    }

    return [value1, value2];
  };

  let filteredValidators;
  let sortedValidators;
  let cumulativeValidators;

  if (validators) {
    filteredValidators = getFilteredValidators();
    sortedValidators = getSortedValidators(filteredValidators);

    const totalBalance = sortedValidators.reduce((acc, v) => acc + Number(v.account.balance), 0);

    let cumulativeBalanceAmount = 0;
    cumulativeValidators = sortedValidators.map((validator) => {
      cumulativeBalanceAmount += Number(validator.account.balance);

      const cumulativeBalance = {
        amount: cumulativeBalanceAmount,
        percentage: (cumulativeBalanceAmount / totalBalance) * 100,
      };

      return {
        ...validator,
        cumulativeBalance,
      };
    });
  }

  function handleSetActive(boo: boolean) {
    /*if (isActive && sortColumn == 'index') {
      setSortColumn('vouches');
      setSortOrder('asc');
    }*/
    setIsActive(boo);
  }

  const columns = [
    { key: 'address', label: 'Address', className: '' },
    //...(isActive ? [{ key: 'index', label: 'Set Position', className: '' }] : []),
    { key: 'grade', label: 'Grade', className: 'text-center' },
    { key: 'vouches', label: 'Vouches', className: '' },
    { key: 'currentBid', label: 'Bid (Exp. Epoch)', className: 'text-right' },
    /*...(isActive
      ? [
          {
            key: 'cumulativeShare',
            label: 'Cumulative Share (%)',
            className: 'text-left whitespace-nowrap',
          },
        ]
      : []),*/
    { key: 'location', label: 'Location', className: 'text-left' },
    { key: 'balance', label: 'Balance', className: 'text-right' },
    // { key: 'unlocked', label: 'Unlocked', className: 'text-right' },
  ];

  return (
    <div className="pt-8 pb-8">
      <ToggleButton isActive={isActive} setIsActive={handleSetActive} />
      <div className="overflow-x-auto">
        <div className="inline-block min-w-full py-2 align-middle">
          <div className="overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-[#FAFAFA]">
                <tr className="text-left text-sm">
                  {columns.map((col) => (
                    <SortableTh
                      key={col.key}
                      column={col.key}
                      sortColumn={sortColumn}
                      sortOrder={sortOrder}
                      onSort={handleSort}
                      className={col.className}
                    >
                      {col.label}
                    </SortableTh>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {cumulativeValidators
                  ? cumulativeValidators.map((validator) => (
                      <ValidatorRow key={validator.address} validator={validator} />
                    ))
                  : Array.from({ length: 10 }).map((_, index) => (
                      <ValidatorRowSkeleton key={index} isActive={isActive} />
                    ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ValidatorsTable;
