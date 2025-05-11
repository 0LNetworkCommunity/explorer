import { FC } from 'react';
import { gql, useQuery, useSubscription } from '@apollo/client';
import clsx from 'clsx';
import Decimal from 'decimal.js';
import { NavLink, Navigate, Outlet, useLocation } from 'react-router-dom';

import Page from '../../../ui/Page/Page';
import { normalizeAddress } from '../../../../utils';
import LibraAmount from '../../../ui/LibraAmount';
import AccountDoesntExist from './AccountDoesntExist';
import { IAccountInfo } from '../../../interface/Account.interface';
import AccountQRCode from '../../../ui/AccountQRCode';

const GET_ACCOUNT = gql`
  query GetAccount($address: Bytes!) {
    account(address: $address) {
      address
      balance
      reauthorized
      slowWallet {
        unlocked
      }
    }
  }
`;

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
    return <Navigate to={pathnames.join('/')} replace={true} />;
  }
  return <Account accountAddress={accountAddress} />;
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

  const { data, error, loading } = useQuery<IAccountInfo>(GET_ACCOUNT, {
    variables: {
      address: accountAddress,
    },
  });

  if (loading) {
    return <div>Loading...</div>;
  }
  if (error) {
    return <div>{error.message}</div>;
  }
  if (data && !data.account) {
    return <AccountDoesntExist address={accountAddress} />;
  }
  if (!data) {
    return null;
  }

  const account = data.account;

  return (
    <Page
      __deprecated_grayBg
      title={
        <div className="flex flex-row items-center max-w-screen-2xl mx-auto">
          <AccountQRCode address={accountAddress} />
          <h1 className="ml-2 text-base font-semibold leading-6 text-gray-900 overflow-hidden text-ellipsis">
            {account.address}
          </h1>
        </div>
      }
    >
      <div className="grid grid-cols-12 gap-4">
        {data.account.balance !== null && (
          <div className="col-span-12 md:col-span-3 mt-5 gap-5">
            <div className="overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:p-6">
              <dt className="truncate text-sm font-medium text-gray-500">
                {account.slowWallet ? <>Unlocked Balance</> : <>Balance</>}
              </dt>
              <dd className="mt-1 md:text-2xl font-semibold tracking-tight text-gray-900">
                {account.slowWallet ? (
                  <LibraAmount>{new Decimal(account.slowWallet.unlocked)}</LibraAmount>
                ) : (
                  <LibraAmount>{new Decimal(data.account.balance)}</LibraAmount>
                )}
              </dd>
            </div>
          </div>
        )}
        {data.account.balance && account.slowWallet && (
          <div className="col-span-12 md:col-span-3 mt-5 gap-5">
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
          </div>
        )}
      </div>

      <div className="border-b border-gray-200">
        <nav className="overflow-x-auto flex space-x-8" aria-label="Tabs">
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
