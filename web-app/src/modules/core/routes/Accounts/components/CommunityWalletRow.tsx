import { FC } from 'react';
import AccountAddress from '../../../../ui/AccountAddress';
import Money from '../../../../ui/Money';
import { ICommunityWallet } from '../../../../interface/CommunityWallets.interface';

interface CommunityWalletRowProps {
  wallet: ICommunityWallet;
}

const CommunityWalletRow: FC<CommunityWalletRowProps> = ({ wallet }) => {
  return (
    <tr className="text-sm text-[#141414] text-center">
      <td className="px-2 md:px-4 lg:px-6 py-4">{wallet.rank}</td>
      <td className="px-2 md:px-4 lg:px-6 py-4">
        <AccountAddress address={wallet.address} />
      </td>
      <td className="px-2 md:px-4 lg:px-6 py-4 text-left" style={{ minWidth: '142px' }}>
        <span
          className="block overflow-hidden"
        >
          {wallet.name}
        </span>
      </td>
      <td className="px-2 md:px-4 lg:px-6 py-4 text-left">
        <span
          className="block overflow-hidden text-ellipsis"
        >
          {wallet.description}
        </span>
      </td>
      <td className="px-2 md:px-4 lg:px-6 py-4 text-right">
        <Money>{wallet.balance}</Money>
      </td>
    </tr>
  );
};

export default CommunityWalletRow;
