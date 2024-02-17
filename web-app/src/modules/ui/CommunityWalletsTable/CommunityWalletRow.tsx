import { FC } from 'react';
import { Link } from 'react-router-dom';
import { ICommunityWalletInfo } from '../../interface/CommunityWallets.interface';

interface Props {
  communityWalletInfo: ICommunityWalletInfo;
}

const CommunityWalletRow: FC<Props> = ({ communityWalletInfo }) => {
  return (
    <tr key={communityWalletInfo.walletAddress}>
      <td className="whitespace-nowrap py-2 px-3 text-sm font-medium text-gray-900">
        {communityWalletInfo.program}
      </td>
      <td className="px-3 py-4 text-sm text-gray-500">{communityWalletInfo.purpose}</td>
      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
        <Link
          to={`/accounts/${communityWalletInfo.walletAddress}`}
          className="text-blue-600 hover:text-blue-900 hover:underline"
        >
          {communityWalletInfo.walletAddress}
        </Link>
      </td>
      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
        {communityWalletInfo.manager}
      </td>
    </tr>
  );
};

export default CommunityWalletRow;
