import { gql, useQuery } from '@apollo/client';
import { FC } from 'react';
import { ICommunityWalletInfo } from '../../interface/CommunityWallets.interface';
import AccountAddress from '../AccountAddress';
import { IAccountInfo } from '../../interface/Account.interface';
import Money from '../Money';

interface Props {
  communityWalletInfo: ICommunityWalletInfo;
}

const GET_ACCOUNT_BALANCE = gql`
  query GetAccount($address: Bytes!) {
    account(address: $address) {
      balance
    }
  }
`;

const CommunityWalletRow: FC<Props> = ({ communityWalletInfo }) => {
  const { data } = useQuery<IAccountInfo>(GET_ACCOUNT_BALANCE, {
    variables: {
      address: communityWalletInfo.address,
    },
  });
  if (!data) {
    return null;
  }

  return (
    <tr>
      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 text-center">
        <AccountAddress address={communityWalletInfo.address} />
      </td>
      <td className="whitespace-nowrap py-2 px-3 text-sm font-medium text-gray-900">
        {communityWalletInfo.name}
      </td>
      <td className="px-3 py-4 text-sm text-gray-500">{communityWalletInfo.description}</td>
      <td className="px-3 py-4 text-sm text-gray-500 text-right whitespace-nowrap">
        {data.account.balance && <Money>{Number(data.account.balance)}</Money>}
      </td>
    </tr>
  );
};

export default CommunityWalletRow;
