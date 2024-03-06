import { FC } from "react";
import { gql, useQuery, useSubscription } from "@apollo/client";
import clsx from "clsx";

import Page from "../../../ui/Page/Page";
import { NavLink, Navigate, Outlet, useLocation } from "react-router-dom";
import { normalizeAddress } from "../../../../utils";
import LibraAmount from "../../../ui/LibraAmount";
import Decimal from "decimal.js";
import AccountDoesntExist from "./AccountDoesntExist";

const GET_ACCOUNT = gql`
  query GetAccount($address: Bytes!) {
    account(address: $address) {
      address
      balance
      slowWallet {
        unlocked
      }
    }
  }
`;

interface GetAccountRes {
  account: {
    address: string;
    balance: string | null;
    slowWallet: {
      unlocked: string;
    } | null
  }
}

const WALLET_MOVEMENT_SUBSCRIPTION = gql`
  subscription OnWalletMovement($address: Bytes!) {
    walletMovement(address: $address)
  }
`;

const AccountWrapper: FC = () => {
  const location = useLocation();
  const pathnames = location.pathname.split('/');
  const accountAddress = pathnames[2];
  const cleanAccountAddress = normalizeAddress(accountAddress);
  if (accountAddress !== cleanAccountAddress) {
    pathnames[2] = cleanAccountAddress;
    return <Navigate to={pathnames.join('/')} replace={true} />
  }
  return (
    <Account accountAddress={accountAddress} />
  );
};

interface Props {
  accountAddress: string;
}

const Account: FC<Props> = ({ accountAddress }) => {
  useSubscription(WALLET_MOVEMENT_SUBSCRIPTION, {
    variables: { address: accountAddress },
    onData(options) {
      console.log('onData', options.data.data);
    },
  });

  const tabs = [
    { name: 'Overview', to: `/accounts/${accountAddress}` },
    { name: 'Transactions', to: `/accounts/${accountAddress}/transactions` },
    { name: 'Resources', to: `/accounts/${accountAddress}/resources` },
    { name: 'Modules', to: `/accounts/${accountAddress}/modules` },
  ];

  const { data, error, loading } = useQuery<GetAccountRes>(GET_ACCOUNT, {
    variables: {
      address: accountAddress,
    },
  });

  if (loading) {
    return (<div>Loading...</div>);
  }
  if (error) {
    return (<div>{error.message}</div>);
  }
  if (data && !data.account) {
    return <AccountDoesntExist address={accountAddress} />;
  }
  if (!data) {
    return null;
  }

  const account = data.account;

  return (
    <Page __deprecated_grayBg>
      <div>
        <dl className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-3">
          <div className="overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:p-6">
            <dt className="truncate text-sm font-medium text-gray-500">Address</dt>
            <dd className="mt-1 font-semibold tracking-tight text-gray-900">{account.address}</dd>
          </div>

          {data.account.balance !== null && (
            <>
              <div className="overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:p-6">
                <dt className="truncate text-sm font-medium text-gray-500">
                  {account.slowWallet ? <>Unlocked Balance</> : <>Balance</>}
                </dt>
                <dd className="mt-1 text-3xl font-semibold tracking-tight text-gray-900">
                  {account.slowWallet ? (
                    <LibraAmount>{new Decimal(account.slowWallet.unlocked)}</LibraAmount>
                  ) : (
                    <LibraAmount>{new Decimal(data.account.balance)}</LibraAmount>
                  )}
                </dd>
              </div>

              {account.slowWallet && (
                <div className="overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:p-6">
                  <dt className="truncate text-sm font-medium text-gray-500">Locked</dt>
                  <dd className="mt-1 text-3xl font-semibold tracking-tight text-gray-900">
                    <LibraAmount>
                      {new Decimal(data.account.balance).minus(
                        new Decimal(account.slowWallet.unlocked),
                      )}
                    </LibraAmount>
                  </dd>
                </div>
              )}
            </>
          )}
        </dl>
      </div>

      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          {tabs.map((tab) => (
            <NavLink
              key={tab.name}
              to={tab.to}
              end
              className={({ isActive }) =>
                clsx(
                  isActive
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700',
                  'group inline-flex items-center border-b-2 py-4 px-1 text-sm font-medium',
                )
              }
            >
              {tab.name}
            </NavLink>
          ))}
        </nav>
      </div>
      <div>
        <Outlet />
      </div>
    </Page>
  );
};

export default AccountWrapper;
