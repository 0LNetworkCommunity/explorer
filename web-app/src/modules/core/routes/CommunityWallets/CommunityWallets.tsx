import { FC } from "react";
import { Link } from "react-router-dom";
import { gql, useQuery } from "@apollo/client";

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
  const { loading, error, data } = useQuery<{
    communityWallets: {
      program: string;
      purpose: string;
      manager: string;
      walletAddress: string;
    }[];
  }>(GET_COMMUNITY_WALLETS);

  if (!data) {
    return null;
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 bg-white">
      <div className="mt-8 flow-root">
        <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
            <table className="min-w-full divide-y divide-gray-300">
              <thead>
                <tr>
                  <th
                    scope="col"
                    className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-0"
                  >
                    Program
                  </th>
                  <th
                    scope="col"
                    className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                  >
                    Purpose
                  </th>
                  <th
                    scope="col"
                    className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                  >
                    Wallet
                  </th>
                  <th
                    scope="col"
                    className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                  >
                    Manager
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {data.communityWallets.map((communityWallet) => (
                  <tr key={communityWallet.walletAddress}>
                    <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-0">
                      {communityWallet.program}
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                      {communityWallet.purpose}
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                      <Link
                        to={`/accounts/${communityWallet.walletAddress}`}
                        className="text-blue-600 hover:text-blue-900 hover:underline"
                      >
                        {communityWallet.walletAddress}
                      </Link>
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                      {communityWallet.manager}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommunityWallets;
