import React, { useState } from 'react';
import { gql, useQuery } from '@apollo/client';
import SortableTh from '../SortableTh';
import VouchesRow from './VouchesRow';
import { ValidatorVouches } from '../../../../../interface/Validator.interface';
import VouchesRowSkeleton from './VouchesRowSkeleton';
import VouchLegend from './VouchLegend';

const GET_VALIDATORS = gql`
  query GetValidatorsVouches {
    getValidatorsVouches {
      address
      handle
      family
      inSet
      validVouches
      compliant
      receivedVouches {
        handle
        address
        compliant
        epochsToExpire
        inSet
        family
      }
      givenVouches {
        handle
        address
        compliant
        epochsToExpire
        inSet
        family
      }
    }
  }
`;

const VouchesTable: React.FC = () => {
  const [showExpired, setShowExpired] = useState(false);
  const [sortColumn, setSortColumn] = useState<string>('compliant');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const { data, error } = useQuery(GET_VALIDATORS, {
    pollInterval: 30000, // Poll every 30 seconds
  });

  if (error) {
    console.log('error', error);
    return <p>{`Error: ${error.message}`}</p>;
  }

  const handleCheckboxChange = () => {
    setShowExpired(!showExpired);
  };

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortOrder('asc');
    }
  };

  const getSortedValidators = (validators: ValidatorVouches[]) => {
    const sortedValidators = [...validators].sort((a, b) => {
      const [aValue, bValue] = getValue(a, b, sortColumn);

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

  const getValue = (a: ValidatorVouches, b: ValidatorVouches, column: string): [any, any] => {
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
      case 'inSet':
        value1 = a.inSet;
        value2 = b.inSet;
        break;
      case 'compliant':
        value1 = a.validVouches;
        value2 = b.validVouches;
        break;
      case 'receivedVouches':
        value1 = a.receivedVouches.length;
        value2 = b.receivedVouches.length;
        break;
      case 'givenVouches':
        value1 = a.givenVouches.length;
        value2 = b.givenVouches.length;
        break;
      default:
        value1 = a.address;
        value2 = b.address;
    }

    return [value1, value2];
  };

  const filteredValidators = data
    ? data.getValidatorsVouches.filter((validator: ValidatorVouches) => {
        if (!showExpired) {
          return validator.receivedVouches.some((vouch) => vouch.epochsToExpire > 0);
        }
        return true;
      })
    : [];

  const sortedValidators = getSortedValidators(filteredValidators);

  const columns = [
    { key: 'address', label: 'Address', sortable: true },
    { key: 'handle', label: 'Handle', sortable: true },
    { key: 'inSet', label: 'In Set', sortable: true },
    { key: 'compliant', label: 'Compliant', sortable: true },
    { key: 'receivedVouches', label: 'Received Vouches', sortable: true },
    { key: 'givenVouches', label: 'Given Vouches', sortable: true },
  ];

  return (
    <>
      <label className="flex items-center mb-4">
        <input
          type="checkbox"
          checked={showExpired}
          onChange={handleCheckboxChange}
          className="mr-2"
        />
        Show Expired
      </label>

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
              >
                {col.label}
              </SortableTh>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {data
            ? sortedValidators.map((validator: ValidatorVouches, index: number) => (
                <VouchesRow
                  key={'vouch_row_' + index}
                  validator={validator}
                  showExpired={showExpired}
                />
              ))
            : [...Array(5)].map((_each, index) => (
                <VouchesRowSkeleton key={'vouch_skeleton_row_' + index} />
              ))}
        </tbody>
      </table>
      <VouchLegend />
      <p className="text-sm text-gray-500 mt-2">
        The data in this table is updated every 60 seconds.
      </p>
    </>
  );
};

export default VouchesTable;
