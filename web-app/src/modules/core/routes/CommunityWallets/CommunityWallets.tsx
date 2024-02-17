import { gql, useQuery } from '@apollo/client';
import { FC } from 'react';
import { ICommunityWalletInfo } from '../../../interface/CommunityWallets.interface';
import CommunityWalletRow from '../../../ui/CommunityWalletsTable';
import Page from '../../../ui/Page';

const GET_COMMUNITY_WALLETS = gql`
  query CommunityWallets {
    communityWallets {
      program
      manager
      walletAddress
      purpose
    }
  }
`;

const CommunityWallets: FC = () => {
  const { data } = useQuery<{
    communityWallets: ICommunityWalletInfo[];
  }>(GET_COMMUNITY_WALLETS);

  if (!data) {
    return null;
  }

  return (
    <Page>
      <div className="mt-2 flow-root">
        <div className="inline-block min-w-full py-1 align-middle px-1">
          <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
            <table className="min-w-full divide-y divide-gray-300">
              <thead className="bg-gray-50 text-left text-sm text-gray-900">
                <tr>
                  <th scope="col" className="px-3 py-2 font-normal">
                    Program
                  </th>
                  <th scope="col" className="px-3 py-2 font-normal">
                    Purpose
                  </th>
                  <th scope="col" className="px-3 py-2 font-normal">
                    Wallet
                  </th>
                  <th scope="col" className="px-3 py-2 font-normal">
                    Manager
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {data.communityWallets.map((communityWalletInfo: ICommunityWalletInfo) => {
                  return (
                    <CommunityWalletRow
                      key={communityWalletInfo.walletAddress}
                      communityWalletInfo={communityWalletInfo}
                    />
                  );
                })}
              </tbody>
            </table>

            {/* @TODO: PAGINATION */}
          </div>
        </div>
      </div>
    </Page>
  );
};

export default CommunityWallets;
