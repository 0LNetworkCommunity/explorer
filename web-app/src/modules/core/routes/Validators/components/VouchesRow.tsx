import React from 'react';
import {
  CheckIcon,
  XMarkIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  GlobeAltIcon,
} from '@heroicons/react/20/solid';
import clsx from 'clsx';
import AccountAddress from '../../../../ui/AccountAddress';
import { ValidatorVouches, VouchDetails } from '../../../../interface/Validator.interface';

type VouchesRowProps = {
  validator: ValidatorVouches;
  showExpired: boolean;
};

function formatAddress(address: string): string {
  return address.slice(0, 4) + '...' + address.slice(-4);
}

const VouchesRow: React.FC<VouchesRowProps> = ({ validator, showExpired }) => {
  return (
    <tr
      key={validator.address}
      className={clsx('whitespace-nowrap text-sm text-[#141414] text-left')}
    >
      <td className="px-2 md:px-4 lg:px-6 py-4">
        <AccountAddress address={validator.address} />
      </td>
      <td className="px-2 md:px-4 lg:px-6 py-4">
        {validator.handle || formatAddress(validator.address)}{' '}
        <FamilyIcon family={validator.family} />{' '}
      </td>
      <td className="px-2 md:px-4 lg:px-6 py-4">
        {validator.inSet ? (
          <CheckIcon className="w-5 h-5 text-green-500 inline" style={{ marginTop: '-3px' }} />
        ) : (
          <XMarkIcon className="w-5 h-5 text-red-500 inline" style={{ marginTop: '-3px' }} />
        )}
      </td>
      <td className="px-2 md:px-4 lg:px-6 py-4">
        {validator.compliant ? (
          <CheckIcon className="w-5 h-5 text-green-500 inline" style={{ marginTop: '-3px' }} />
        ) : (
          <XMarkIcon className="w-5 h-5 text-red-500 inline" style={{ marginTop: '-3px' }} />
        )}
        <span className="ml-2">{validator.validVouches}</span>
      </td>
      <td
        className="px-2 md:px-4 lg:px-6 py-4"
        style={{ maxWidth: '500px', wordWrap: 'break-word', whiteSpace: 'normal' }}
      >
        {validator.receivedVouches
          .filter((vouch: VouchDetails) => showExpired || vouch.epochsToExpire > 0)
          .map((vouch: VouchDetails, index: number) => (
            <VouchChip key={index} index={index} vouch={vouch} />
          ))}
      </td>
      <td
        className="px-2 md:px-4 lg:px-6 py-4"
        style={{ maxWidth: '500px', wordWrap: 'break-word', whiteSpace: 'normal' }}
      >
        {validator.givenVouches
          .filter((vouch: VouchDetails) => showExpired || vouch.epochsToExpire > 0)
          .map((vouch: VouchDetails, index: number) => (
            <VouchChip key={index} index={index} vouch={vouch} />
          ))}
      </td>
    </tr>
  );
};

const FamilyIcon: React.FC<{ family: string }> = ({ family }) => {
  const bgColor = family && family.length > 8 ? `#${family.slice(2, 8)}` : `#f87171`;
  return (
    <span
      className="inline-block w-3 h-3 rounded-full ml-2"
      style={{ backgroundColor: bgColor }}
    ></span>
  );
};

const VouchChip: React.FC<{ vouch: VouchDetails; index: number }> = ({ vouch, index }) => {
  // Generate background color for the chip based on the family (hexadecimal)
  return (
    <span
      key={index}
      className={clsx(
        'inline-flex items-center px-2 py-1 rounded-full text-sm font-medium text-black',
      )}
      style={{
        backgroundColor: '#F0F0F0',
        marginRight: '8px',
        marginBottom: '8px',
      }}
    >
      {vouch.inSet && <GlobeAltIcon className="w-4 h-4 text-blue-500 mr-1" />}
      {vouch.compliant ? (
        <CheckIcon className="w-4 h-4 text-green-500 mr-1" />
      ) : (
        <XMarkIcon className="w-4 h-4 text-red-500 mr-1" />
      )}

      {vouch.epochsToExpire <= 7 && vouch.epochsToExpire > 0 && (
        <ExclamationTriangleIcon className="w-4 h-4 text-yellow-500 mr-1" />
      )}

      {vouch.epochsToExpire <= 0 && <ClockIcon className="w-4 h-4 text-red-500 mr-1" />}

      {/* handle or address 1234...5678*/}
      {vouch.handle || formatAddress(vouch.address)}
      <span className="ml-1" style={{ fontSize: 8 }}>
        {' '}
        ({vouch.epochsToExpire})
      </span>

      <FamilyIcon family={vouch.family} />
    </span>
  );
};

export default VouchesRow;
