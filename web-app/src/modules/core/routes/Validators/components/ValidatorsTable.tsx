import { FC, useState } from 'react';
import { IValidator } from '../../../../interface/Validator.interface';
import SortableTh from './SortableTh';
import ValidatorRow from './ValidatorRow';
import ValidatorRowSkeleton from './ValidatorRowSkeleton';
import { CheckCircleIcon, ExclamationCircleIcon, XCircleIcon } from '@heroicons/react/20/solid';

interface ValidatorsTableProps {
  validators?: IValidator[];
  activeValue: string;
}

type SortOrder = 'asc' | 'desc';

const ValidatorsTable: FC<ValidatorsTableProps> = ({ validators, activeValue }) => {
  const [sortColumn, setSortColumn] = useState<string>('index');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [previousSortColumn, setPreviousSortColumn] = useState<string>('vouches');
  const [isActive] = useState(true);

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
          if (activeValue === 'active') {
            return validator.inSet;
          }
          return !validator.inSet;
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
      case 'handle':
        value1 = a.handle;
        value2 = b.handle;
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
      case 'audit':
        value1 = a.auditQualification ? a.auditQualification.length : 0;
        value2 = b.auditQualification ? b.auditQualification.length : 0;
        break;
      case 'vfnStatus':
        value1 = a.vfnStatus;
        value2 = b.vfnStatus;
        break;
      case 'vouches':
        value1 = a.vouches.valid;
        value2 = b.vouches.valid;
        break;
      case 'currentBid':
        value1 = a.currentBid ? a.currentBid.currentBid : 0;
        value2 = b.currentBid ? b.currentBid.currentBid : 0;
        break;
      case 'cumulativeShare':
        value1 = a.cumulativeBalance?.percentage ?? 0;
        value2 = b.cumulativeBalance?.percentage ?? 0;
        break;
      case 'location':
        value1 = a.country ? a.country + a.city : '';
        value2 = b.country ? b.country + b.city : '';
        break;
      case 'balance':
        value1 = Number(a.balance);
        value2 = Number(b.balance);
        break;
      case 'unlocked':
        value1 = a.unlocked ? Number(a.unlocked) : 0;
        value2 = b.unlocked ? Number(b.unlocked) : 0;
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

    const totalBalance = validators.reduce((acc, v) => acc + Number(v.balance), 0);

    let cumulativeBalanceAmount = 0;
    cumulativeValidators = sortedValidators.map((validator) => {
      cumulativeBalanceAmount += Number(validator.balance);

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

  const columns = [
    { key: 'address', label: 'Address', className: '' },
    { key: 'handle', label: 'Handle', className: 'text-center' },
    ...(activeValue === 'active'
      ? [{ key: 'grade', label: 'Grade', className: 'text-center' }]
      : []),
    { key: 'audit', label: 'Audit', className: 'text-center' },
    { key: 'vouches', label: 'Vouches', className: 'text-center' },
    { key: 'currentBid', label: 'Bid (Exp. Epoch)', className: 'text-right' },
    ...(activeValue === 'active'
      ? [{ key: 'vfnStatus', label: 'VFN', className: 'text-center' }]
      : []),
    { key: 'unlocked', label: 'Unlocked', className: 'text-right' },
    { key: 'balance', label: 'Balance', className: 'text-right' },
    ...(activeValue === 'active'
      ? [
          /*{
            key: 'cumulativeShare',
            label: 'Cumulative Share (%)',
            className: 'text-left whitespace-nowrap',
          },*/
          { key: 'location', label: 'Location', className: 'text-left' },
        ]
      : []),
    // { key: 'unlocked', label: 'Unlocked', className: 'text-right' },
  ];

  return (
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
          <AuditLegend />
          <VfnLegend />
        </div>
      </div>
    </div>
  );
};

const AuditLegend: FC = () => {
  const legendItems = [
    { code: 11, description: 'Validator is not configured' },
    { code: 12, description: 'Not a slow wallet' },
    { code: 13, description: 'Validator is jailed' },
    { code: 14, description: 'Not enough vouches' },
    { code: 15, description: 'Bid is zero' },
    { code: 16, description: 'Bid has expired' },
    { code: 17, description: 'Not enough coin balance' },
  ];

  return (
    <div className="mt-4 p-4 bg-[#F5F5F5] text-[#525252] rounded-md">
      <h2 className="text-lg font-bold mb-2">Audit Legend</h2>
      <ul className="list-disc pl-5 space-y-1">
        {legendItems.map((item) => (
          <li key={item.code}>
            <strong>{item.code}:</strong> {item.description}
          </li>
        ))}
      </ul>
    </div>
  );
};

const VfnLegend: FC = () => {
  return (
    <div className="mt-4 p-4 bg-[#F5F5F5] text-[#525252] rounded-md">
      <h2 className="text-lg font-bold mb-2">VFN Legend</h2>
      <ul className="list-disc pl-5 space-y-1">
        <li key={1} className="flex items-center space-x-2">
          <CheckCircleIcon className="h-5 w-5 text-green-500" />
          <span className="font-bold">Accessible</span>
        </li>
        <li key={2} className="flex items-center space-x-2">
          <ExclamationCircleIcon className="h-5 w-5 text-yellow-500" />
          <span className="font-bold">Not Accessible</span>
        </li>
        <li key={3} className="flex items-center space-x-2">
          <XCircleIcon className="h-5 w-5 text-red-500" />
          <span className="font-bold">Invalid Configuration</span>
        </li>
      </ul>
    </div>
  );
};

export default ValidatorsTable;
