import { FC } from 'react';
import clsx from 'clsx';
import AccountAddress from '../../../../ui/AccountAddress';
import Money from '../../../../ui/Money';
import { IValidator } from '../../../../interface/Validator.interface';
import { CheckIcon, XMarkIcon } from '@heroicons/react/20/solid';
import ProgressBar from './ProgressBar';
import Vouches from './Vouches';

interface ValidatorRowProps {
  validator: IValidator;
}

const ValidatorRow: FC<ValidatorRowProps> = ({ validator }) => {
  return (
    <tr className={clsx('whitespace-nowrap text-sm text-[#141414] text-center')}>
      <td className="px-2 md:px-4 lg:px-6 py-4">
        <AccountAddress address={validator.address} />
      </td>
      {validator.inSet ? (
        <td className="px-2 md:px-4 lg:px-6 py-4 text-center">
          {validator.grade.compliant ? (
            <CheckIcon className="w-5 h-5 text-green-500 inline" style={{ marginTop: '-3px' }} />
          ) : (
            <XMarkIcon className="w-5 h-5 text-red-500 inline" style={{ marginTop: '-3px' }} />
          )}
          <span className={validator.grade.failedBlocks > 0 ? 'text-red-500' : ''}>
            {validator.grade.failedBlocks.toLocaleString()}
          </span>{' '}
          / {validator.grade.proposedBlocks.toLocaleString()}
        </td>
      ) : (
        <td className="px-2 md:px-4 lg:px-6 py-4 text-center">
          {validator.auditQualification?.toLocaleString()}
        </td>
      )}
      <td className="px-2 md:px-4 lg:px-6 py-4 text-center">
        <Vouches vouches={validator.vouches} />
      </td>
      <td className="px-2 md:px-4 lg:px-6 py-4 text-right">
        {`${validator.currentBid && validator.currentBid.currentBid.toLocaleString()} (${
          validator.currentBid && validator.currentBid.expirationEpoch.toLocaleString()
        })`}
      </td>
      <td className="px-2 md:px-4 lg:px-6 py-4 text-right">
        <Money>{Number(validator.balance)}</Money>
      </td>
      {validator.inSet && (
        <td className="px-2 md:px-4 lg:px-6 py-4">
          <ProgressBar
            percentage={validator.cumulativeBalance ? validator.cumulativeBalance.percentage : 0}
            amount={validator.cumulativeBalance ? validator.cumulativeBalance.amount : 0}
          />
        </td>
      )}
      {validator.inSet && (
        <td className="px-2 md:px-4 lg:px-6 py-4 text-left">
          {validator.city ? `${validator.city}, ${validator.country}` : 'Unknown'}
        </td>
      )}
      {/*<td className="px-2 md:px-4 lg:px-6 py-4 text-right">
        {validator.account.slowWallet ? (
          <Money>{Number(validator.unlocked)}</Money>
        ) : (
          ''
        )}
      </td>*/}
    </tr>
  );
};

export default ValidatorRow;
