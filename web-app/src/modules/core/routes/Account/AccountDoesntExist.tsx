import { FC } from 'react';

import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';

interface Props {
  address: string;
}

const AccountDoesntExist: FC<Props> = ({ address }) => {
  return (
    <main className="grid place-items-center px-6 py-24 sm:py-32 lg:px-8">
      <div className="text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center">
          <ExclamationTriangleIcon className="h-12 w-12 text-red-600" aria-hidden="true" />
        </div>
        <h1 className="mt-4 text-3xl font-bold tracking-tight text-gray-900 sm:text-5xl">
          Account not found
        </h1>
        <p className="mt-6 text-base leading-7 text-gray-600 ">
          The crypto account associated with the specified address (
          <span className="font-mono">{address}</span>) could not be found.
          <br />
          This may be because the account was recently created and our system is still updating.
          <br />
          <br />
          <span className="text-sm font-medium text-red-800 text-xl">
            Please avoid sending tokens to this address, as there's a possibility of funds being
            lost.
          </span>
        </p>
      </div>
    </main>
  );
};

export default AccountDoesntExist;
