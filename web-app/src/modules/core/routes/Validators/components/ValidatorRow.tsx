import { FC } from 'react';
import clsx from 'clsx';
import AccountAddress from '../../../../ui/AccountAddress';
import Money from '../../../../ui/Money';
import { IValidator } from '../../../../interface/Validator.interface';
import ProgressBar from './ProgressBar';

interface ValidatorRowProps {
  validator: IValidator;
  isActive: boolean;
}

const ValidatorRow: FC<ValidatorRowProps> = ({ validator, isActive }) => {
  return (
    <tr className={clsx('whitespace-nowrap text-sm text-gray-500 text-center')}>
      <td className="px-2 md:px-4 lg:px-6 py-4">
        <AccountAddress address={validator.address} />
      </td>
      {/*isActive && (
        <td className="px-2 md:px-4 lg:px-6 py-4 text-center">{Number(validator.index) + 1}</td>
      )*/}
      <td className="px-2 md:px-4 lg:px-6 py-4 text-center">
        {validator.vouches.length.toLocaleString()}
      </td>
      <td className="px-2 md:px-4 lg:px-6 py-4 text-right">
        {`${validator.currentBid && validator.currentBid.currentBid.toLocaleString()} (${
          validator.currentBid && validator.currentBid.expirationEpoch.toLocaleString()
        })`}
      </td>
      {isActive && (
        <td className="px-2 md:px-4 lg:px-6 py-4">
          <ProgressBar
            percentage={validator.cumulativeBalance ? validator.cumulativeBalance.percentage : 0}
            amount={validator.cumulativeBalance ? validator.cumulativeBalance.amount : 0}
          />
        </td>
      )}
      <td className="px-2 md:px-4 lg:px-6 py-4 text-left">
        {validator.city ? `${validator.city}, ${validator.country}` : 'Unknown'}
      </td>
      <td className="px-2 md:px-4 lg:px-6 py-4 text-right">
        <Money>{Number(validator.account.balance)}</Money>
      </td>
      {/*<td className="px-2 md:px-4 lg:px-6 py-4 text-right">
        {validator.account.slowWallet ? (
          <Money>{Number(validator.account.slowWallet.unlocked)}</Money>
        ) : (
          ''
        )}
      </td>*/}
    </tr>
  );
};

export default ValidatorRow;
