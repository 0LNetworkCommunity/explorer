import React from 'react';
import { CheckIcon, XMarkIcon, ShieldCheckIcon } from '@heroicons/react/20/solid';
import clsx from 'clsx';
import AccountAddress from '../../../../ui/AccountAddress';
import { ValidatorVouches, VouchDetails } from '../../../../interface/Validator.interface';

type VouchesRowProps = {
  validator: ValidatorVouches;
  showExpired: boolean;
};

const VouchesRow: React.FC<VouchesRowProps> = ({ validator, showExpired }) => {
  return (
    <tr
      key={validator.address}
      className={clsx('whitespace-nowrap text-sm text-[#141414] text-left')}
    >
      <td className="px-2 md:px-4 lg:px-6 py-4">
        <AccountAddress address={validator.address} />
      </td>
      <td className="px-2 md:px-4 lg:px-6 py-4">{validator.handle}</td>
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

const VouchChip: React.FC<{ vouch: VouchDetails; index: number }> = ({ vouch, index }) => {
  // Generate background color for the chip based on the family (hexadecimal)
  const bgColor =
    vouch.family && vouch.family.length > 8 ? `#${vouch.family.slice(2, 8)}` : `#f87171`;
  return (
    <span
      key={index}
      className={clsx(
        'inline-flex items-center px-2 py-1 rounded-full text-sm font-medium text-black',
      )}
      style={{
        backgroundColor: bgColor,
        marginRight: '8px',
        marginBottom: '8px',
      }}
    >
      {vouch.inSet && <ShieldCheckIcon className="w-4 h-4 text-blue-500 mr-1" />}
      {vouch.compliant ? (
        <CheckIcon className="w-4 h-4 text-green-500 mr-1" />
      ) : (
        <XMarkIcon className="w-4 h-4 text-red-500 mr-1" />
      )}
      {vouch.handle} {vouch.family.slice(0, 4)}
      <span style={{ fontSize: 8 }}> ({vouch.epochsToExpire})</span>
    </span>
  );
};

export default VouchesRow;
