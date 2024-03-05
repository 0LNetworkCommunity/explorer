import { gql, useQuery } from '@apollo/client';
import { FC } from 'react';

import { ICommunityWalletInfo } from '../../../interface/CommunityWallets.interface';
import CommunityWalletRow from '../../../ui/CommunityWalletsTable';
import Page from '../../../ui/Page';

const GET_COMMUNITY_WALLETS = gql`
  query CommunityWallets {
    communityWallets {
      address
      name
      description
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
    <Page __deprecated_grayBg>
      <div className="mt-2 flow-root overflow-x-auto">
        <div className="inline-block min-w-full py-1 align-middle px-1">
          <div className="sm:flex sm:items-center pb-2">
            <div className="sm:flex-auto">
              <h1 className="text-base font-semibold leading-6 text-gray-900">Community wallets</h1>
            </div>
            <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
              <a
                className="text-gray-900 hover:underline hover:text-primary-500"
                href="https://github.com/0LNetworkCommunity/explorer/edit/main/api/src/ol/community-wallets.ts"
              >
                Edit this page
              </a>
            </div>
          </div>

          <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
            <table className="min-w-full divide-y divide-gray-300">
              <thead className="bg-gray-50 text-left text-sm text-gray-900">
                <tr>
                  <th scope="col" className="px-3 py-2 font-normal">
                    Wallet
                  </th>
                  <th scope="col" className="px-3 py-2 font-normal">
                    Name
                  </th>
                  <th scope="col" className="px-3 py-2 font-normal">
                    Description
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {data.communityWallets.map((communityWalletInfo: ICommunityWalletInfo) => {
                  return (
                    <CommunityWalletRow
                      key={communityWalletInfo.address}
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
