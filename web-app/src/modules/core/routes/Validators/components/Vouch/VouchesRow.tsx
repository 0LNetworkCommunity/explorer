import React from 'react';
import { CheckIcon, XMarkIcon } from '@heroicons/react/20/solid';
import clsx from 'clsx';
import AccountAddress from '../../../../../ui/AccountAddress';
import { ValidatorVouches, VouchDetails } from '../../../../../interface/Validator.interface';
import { VouchChip } from './VouchChip';
import { FamilyIcon } from './FamilyIcon';
import { formatAddress } from '../../../../../../utils';

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

export default VouchesRow;
