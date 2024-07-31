import { FC } from 'react';
import { ITopLiquidAccount } from '../../../../interface/TopLiquidAccount.interface';
import AccountAddress from '../../../../ui/AccountAddress';
import Money from '../../../../ui/Money';
import ProgressBar from '../../Validators/components/ProgressBar';

interface TopLiquidAccountRowProps {
  account: ITopLiquidAccount;
}

const TopLiquidAccountRow: FC<TopLiquidAccountRowProps> = ({ account }) => {
  return (
    <tr className="whitespace-nowrap text-sm text-[#141414] text-center">
      <td className="px-2 md:px-4 lg:px-6 py-4">{account.rank}</td>
      <td className="px-2 md:px-4 lg:px-6 py-4 text-left">
        <AccountAddress address={account.address} />
      </td>
      <td className="px-2 md:px-4 lg:px-6 py-4 text-left">{account.name}</td>
      <td className="px-2 md:px-4 lg:px-6 py-4 text-right">
        <Money>{account.unlocked}</Money>
      </td>
      <td className="px-2 md:px-4 lg:px-6 py-4">
        <ProgressBar percentage={account.liquidShare} amount={account.liquidShare} precision={2} />
      </td>
    </tr>
  );
};

export default TopLiquidAccountRow;
