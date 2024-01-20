import { FC, PropsWithChildren, useState, useEffect } from "react";
import { useNavigate, useLocation } from 'react-router-dom';
import clsx from "clsx";
import { Link, NavLink } from "react-router-dom";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import Logo from "../Logo/Logo";
import { PosteroWalletName } from "../../postero-wallet";

const navigation = [
  { name: "Transactions", to: "/transactions" },
  { name: "Validators", to: "/validators" },
];

const AppFrame: FC<PropsWithChildren> = ({ children }) => {
  const aptosWallet = useWallet();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchAddress, setSearchAddress] = useState('');

  useEffect(() => {
    // Clear search input when navigating to the home page
    if (location.pathname === '/') {
      setSearchAddress('');
    }
  }, [location.pathname]);

  const connectWallet = () => {
    aptosWallet.connect(PosteroWalletName);
  };

  const handleSearch = () => {
    // Check if the length is 32, 34, 62, or 64 characters
    const validLengths = [32, 34, 62, 64];
    if (validLengths.includes(searchAddress.trim().length)) {
      navigate(`/accounts/${searchAddress.trim()}/resources`);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <>
      <div className="min-h-full">
        <nav className="bg-primary-500">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="flex h-11 items-center justify-between">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Link to="/">
                    <Logo className="h-6 w-6" />
                  </Link>
                </div>
                <div className="ml-10 flex items-baseline space-x-4">
                  {navigation.map((item, index) => (
                    <NavLink
                      key={index}
                      end
                      to={item.to}
                      className={({ isActive }) =>
                        clsx(
                          isActive
                            ? "bg-primary-700 text-white"
                            : "text-white hover:underline",
                          "rounded-md px-3 py-1 text-sm"
                        )
                      }
                    >
                      {item.name}
                    </NavLink>
                  ))}
                </div>
              </div>

              <div className="flex items-center">
                {import.meta.env.VITE_FEATURE_WALLET === "true" && (
                  <div className="flex items-baseline space-x-4">
                    {aptosWallet.account ? (
                      <>
                        <div className="text-sm">
                          {aptosWallet.account.address}
                        </div>
                        <button
                          type="button"
                          className={clsx(
                            "text-white hover:underline",
                            "rounded-md text-sm px-3 py-1"
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
                        className={clsx(
                          "text-white hover:underline",
                          "rounded-md px-3 py-1 text-sm"
                        )}
                        onClick={connectWallet}
                      >
                        Connect
                      </button>
                    )}
                  </div>
                )}
                <div className="ml-auto flex items-center">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search address"
                      value={searchAddress}
                      onChange={(e) => setSearchAddress(e.target.value)}
                      onKeyDown={handleKeyDown}
                      className="rounded-l-md px-3 py-1 text-sm border border-r-0"
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 bg-primary-700 hover:bg-primary-600 text-white border border-primary-700 flex items-center justify-center p-2 transition duration-150 ease-in-out"
                      onClick={handleSearch}
                      style={{ width: '2.5rem' }} // Adjust the width as needed
                    >
                      🔍
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </nav>

        {children}
      </div>
    </>
  );
};

export default AppFrame;
