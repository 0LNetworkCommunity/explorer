import { useWallet } from '@aptos-labs/wallet-adapter-react';
import { Bars3Icon, MagnifyingGlassIcon } from '@heroicons/react/20/solid';
import clsx from 'clsx';
import React, { useRef, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { PosteroWalletName } from '../../../postero-wallet';
import Logo from '../../Logo/Logo';

const navigation = [
  { name: 'Transactions', to: '/transactions' },
  { name: 'Validators', to: '/validators' },
  { name: 'Stats', to: '/stats' },
  { name: 'Community Wallets', to: '/community-wallets' },
];

const Header: React.FC = () => {
  const aptosWallet = useWallet();
  const navigate = useNavigate();
  const [menuIsOpen, setMenuIsOpen] = useState<boolean>(false);
  const [searchAddress, setSearchAddress] = useState<string>('');
  const searchInput = useRef<HTMLInputElement>(null);

  const connectWallet = () => {
    aptosWallet.connect(PosteroWalletName);
  };

  const onSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const input = searchAddress.trim();
    // Check if the length is 32, 34, 62, or 64 characters
    const validLengths = [32, 34, 62, 64];
    if (validLengths.includes(input.length)) {
      navigate(`/accounts/${encodeURIComponent(input)}/resources`);
      setSearchAddress('');
      if (searchInput.current) {
        searchInput.current.blur();
      }
    }
  };

  const sliceHexAddress = (address: string | null) =>
    address ? `${address.slice(0, 5)}...${address.slice(-3)}` : '';

  return (
    <header className="bg-primary-500">
      <nav className="flex px-5 py-3 flex-col">
        <div className="flex items-center gap-3">
          <Link to="/">
            <Logo className="h-7 w-7" />
          </Link>

          <div className="hidden md:flex items-center gap-1">
            {navigation.map((item, index) => (
              <NavLink
                key={index}
                end
                to={item.to}
                className={({ isActive }) =>
                  clsx(
                    isActive ? 'bg-primary-700 text-white' : 'text-white hover:underline',
                    'rounded-md p-3 text-sm text-nowrap',
                  )
                }
              >
                {item.name}
              </NavLink>
            ))}
          </div>

          <div className="w-full ml-auto justify-end items-center gap-2 hidden md:flex">
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
                    'block w-full rounded-md border-0 bg-white py-1 pl-10 pr-3',
                    'text-gray-900 text-sm',
                    'focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-primary-600',
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

          <button
            className="h-6 w-6 text-white ml-auto flex md:hidden"
            aria-label="Open Burger Menu"
            onClick={() => setMenuIsOpen(!menuIsOpen)}
          >
            <Bars3Icon />
          </button>
        </div>
        {menuIsOpen && (
          <div className="block md:hidden">
            <ul className="w-full py-3">
              {navigation.map((item, index) => (
                <li key={index} className="p-1">
                  <NavLink
                    end
                    to={item.to}
                    onClick={() => setMenuIsOpen(false)}
                    className={({ isActive }) =>
                      clsx(
                        isActive ? 'bg-primary-700 text-white' : 'text-white hover:underline',
                        'rounded-md text-sm w-full block p-2 text-nowrap',
                      )
                    }
                  >
                    {item.name}
                  </NavLink>
                </li>
              ))}
            </ul>
            <form className="w-full px-1" onSubmit={onSearch}>
              <div className="relative text-gray-400 focus-within:text-gray-600">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <MagnifyingGlassIcon className="h-5 w-5" aria-hidden="true" />
                </div>
                <input
                  id="search"
                  className={clsx(
                    'block w-full rounded-md border-0 bg-white py-1 pl-10 pr-3',
                    'text-gray-900 text-sm',
                    'focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-primary-600',
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
        )}
      </nav>
    </header>
  );
};
export default Header;
