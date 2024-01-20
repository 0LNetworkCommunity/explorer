import { FC, PropsWithChildren, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import clsx from "clsx";
import { Link, NavLink } from "react-router-dom";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import Logo from "../Logo/Logo";
import { PosteroWalletName } from "../../postero-wallet";
import { MagnifyingGlassIcon } from "@heroicons/react/20/solid";

const navigation = [
  { name: "Transactions", to: "/transactions" },
  { name: "Validators", to: "/validators" },
];

const AppFrame: FC<PropsWithChildren> = ({ children }) => {
  const aptosWallet = useWallet();
  const navigate = useNavigate();
  const [searchAddress, setSearchAddress] = useState("");
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

                <div className="flex flex-1 justify-center px-2 ml-6">
                  <form
                    className="w-full max-w-lg lg:max-w-xs"
                    onSubmit={onSearch}
                  >
                    <div className="relative text-gray-400 focus-within:text-gray-600">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                        <MagnifyingGlassIcon
                          className="h-5 w-5"
                          aria-hidden="true"
                        />
                      </div>
                      <input
                        id="search"
                        className={clsx(
                          "block w-full rounded-md border-0 bg-white py-1 pl-10 pr-3 text-gray-900",
                          "focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-primary-600"
                        )}
                        placeholder="Search Address"
                        type="search"
                        name="search"
                        ref={searchInput}
                        value={searchAddress}
                        onChange={(event) =>
                          setSearchAddress(event.target.value)
                        }
                      />
                    </div>
                  </form>
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
