import React, { useRef, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Bars3Icon } from '@heroicons/react/20/solid';
import { MagnifyingGlassIcon } from '@heroicons/react/20/solid';
import clsx from 'clsx';
import { useWallet } from '@aptos-labs/wallet-adapter-react';

import { PosteroWalletName } from '../../../postero-wallet';
import { normalizeAddress } from '../../../../utils';
import Logo from '../../Logo/Logo';

const navigation = [
  { name: 'Home', to: '/' },
  { name: 'Transactions', to: '/transactions' },
  { name: 'Validators', to: '/validators' },
  { name: 'Community Wallets', to: '/community-wallets' },
  { name: 'Accounts', to: '/accounts' },
  { name: 'Stats', to: '/stats' },
];

const Header: React.FC = () => {
  const [menuIsOpen, setMenuIsOpen] = useState<boolean>(false);

  const aptosWallet = useWallet();
  const navigate = useNavigate();
  const [searchAddress, setSearchAddress] = useState<string>('');
  const searchInput = useRef<HTMLInputElement>(null);
  const connectWallet = () => {
    aptosWallet.connect(PosteroWalletName);
  };

  const onSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const input = searchAddress.trim();

    try {
      const addr = normalizeAddress(input);
      navigate(`/accounts/${encodeURIComponent(addr)}/resources`);
      setSearchAddress('');
      if (searchInput.current) {
        searchInput.current.blur();
      }
    } catch (error) {
      console.warn(error);
    }
  };

  const sliceHexAddress = (address: string | null) =>
    address ? `${address.slice(0, 5)}...${address.slice(-3)}` : '';

  return (
    <header className="bg-white">
      <nav className="flex px-2 py-5 flex-col max-w-screen-2xl mx-auto">
        <div className="flex items-center gap-20">
          <Link to="/">
            <Logo className="h-10 w-10 p-2 rounded bg-[#CD3B42]" withText={false} />
          </Link>

          <div className="hidden lg:flex gap-5 flex-grow">
            {navigation.map((item, index) => (
              <NavLink
                key={index}
                end
                to={item.to}
                className={({ isActive }) =>
                  clsx(
                    isActive ? 'border-b border-[#DE2F32] text-[#292929]' : 'text-[#424242]',
                    'text-md font-medium px-2 py-3 text-nowrap',
                  )
                }
              >
                {item.name}
              </NavLink>
            ))}
          </div>

          <div className="justify-end items-center gap-2 hidden justify-self-end lg:flex">
            {localStorage.getItem('postero_enabled') === 'true' && (
              <div className="flex items-baseline gap-2">
                <div className="flex items-baseline space-x-4">
                  {aptosWallet.account ? (
                    <>
                      <div className="text-sm text-white">
                        {sliceHexAddress(aptosWallet.account.address)}
                      </div>
                      <button
                        type="button"
                        className={clsx(
                          'text-white hover:underline',
                          'rounded-md text-sm px-3 py-1',
                        )}
                        onClick={() => {
                          aptosWallet.disconnect();
                        }}
                      >
                        Disconnect
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      className={clsx('text-white hover:underline', 'rounded-md px-3 py-1 text-sm')}
                      onClick={connectWallet}
                    >
                      Connect
                    </button>
                  )}
                </div>
              </div>
            )}

            <form className="w-full max-w-xs" onSubmit={onSearch}>
              <div className="relative text-gray-400 focus-within:text-gray-600">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <MagnifyingGlassIcon className="h-5 w-5" aria-hidden="true" />
                </div>
                <input
                  id="search"
                  className={clsx(
                    'ring-1',
                    'block w-full rounded-md border-0 bg-white py-1 pl-10 pr-3',
                    'text-gray-900 text-sm',
                    'focus:ring-2 ring-white ring-offset-2 ring-offset-primary-600',
                  )}
                  placeholder="Search Address"
                  type="search"
                  name="search"
                  ref={searchInput}
                  value={searchAddress}
                  onChange={(event) => setSearchAddress(event.target.value)}
                />
              </div>
            </form>
          </div>

          <div className="flex flex-grow justify-end lg:hidden">
            <button
              className="text-[#080808]"
              aria-label="Open Burger Menu"
              type="button"
              onClick={() => setMenuIsOpen(!menuIsOpen)}
            >
              <Bars3Icon className="h-6 w-6" />
            </button>
          </div>
        </div>
        <div
          className={clsx('block lg:hidden transition-all duration-300 overflow-hidden w-full', {
            'max-h-screen': menuIsOpen,
            'max-h-0': !menuIsOpen,
          })}
        >
          <ul className="w-full pt-5 pb-3 flex flex-col gap-4">
            {navigation.map((item, index) => (
              <li key={index} className="p-1">
                <NavLink
                  end
                  to={item.to}
                  onClick={() => setMenuIsOpen(false)}
                  className={({ isActive }) =>
                    clsx(
                      isActive ? 'border-b border-[#DE2F32] text-[#292929]' : 'text-[#424242]',
                      'text-md font-medium py-3 text-nowrap',
                    )
                  }
                >
                  {item.name}
                </NavLink>
              </li>
            ))}
          </ul>
          <form className="w-full px-1 py-1" onSubmit={onSearch}>
            <div className="relative text-gray-400 focus-within:text-gray-600">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <MagnifyingGlassIcon className="h-5 w-5" aria-hidden="true" />
              </div>
              <input
                id="search"
                className={clsx(
                  'ring-1',
                  'block w-full rounded-md border-0 bg-white py-1 pl-10 pr-3',
                  'text-gray-900 text-sm',
                  'focus:ring-2 ring-white ring-offset-2 ring-offset-primary-600',
                )}
                placeholder="Search Address"
                type="search"
                name="search"
                ref={searchInput}
                value={searchAddress}
                onChange={(event) => setSearchAddress(event.target.value)}
              />
            </div>
          </form>
        </div>
      </nav>
    </header>
  );
};
export default Header;
