import { FC } from 'react';
import { ITopAccount } from '../../../../interface/TopAccount.interface';
import AccountAddress from '../../../../ui/AccountAddress';
import Money from '../../../../ui/Money';
import ProgressBar from '../../Validators/components/ProgressBar';

interface TopAccountRowProps {
  account: ITopAccount;
}

const TopAccountRow: FC<TopAccountRowProps> = ({ account }) => {
  return (
    <tr className="whitespace-nowrap text-sm text-[#141414] text-center">
      <td className="px-2 md:px-4 lg:px-6 py-4">{account.rank}</td>
      <td className="px-2 md:px-4 lg:px-6 py-4 text-left">
        <AccountAddress address={account.address} />
      </td>
      <td className="px-2 md:px-4 lg:px-6 py-4 text-left">{account.publicName}</td>
      <td className="px-2 md:px-4 lg:px-6 py-4 text-right">
        <Money>{account.balance}</Money>
      </td>
      <td className="px-2 md:px-4 lg:px-6 py-4">
        <ProgressBar
          percentage={account.cumulativeShare.percentage}
          amount={account.cumulativeShare.amount}
        />
      </td>
    </tr>
  );
};

export default TopAccountRow;
