import { FC } from 'react';
import { ICommunityWalletInfo } from '../../interface/CommunityWallets.interface';
import AccountAddress from '../AccountAddress';

interface Props {
  communityWalletInfo: ICommunityWalletInfo;
}

const CommunityWalletRow: FC<Props> = ({ communityWalletInfo }) => {
  return (
    <tr>
      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
        <AccountAddress address={communityWalletInfo.address} />
      </td>
      <td className="whitespace-nowrap py-2 px-3 text-sm font-medium text-gray-900">
        {communityWalletInfo.name}
      </td>
      <td className="px-3 py-4 text-sm text-gray-500">{communityWalletInfo.description}</td>
    </tr>
  );
};

export default CommunityWalletRow;
