import { FC, PropsWithChildren } from "react";
import clsx from "clsx";
import { Link, NavLink } from "react-router-dom";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import Logo from "../Logo/Logo";
import { PosteroWalletName } from "../../postero-wallet";

const navigation = [
  { name: "Transactions", to: "/transactions" },
  { name: "Validators", to: "/validators" },
  { name: "Coin Stats", to: "/coinstats" },
];

const AppFrame: FC<PropsWithChildren> = ({ children }) => {
  const aptosWallet = useWallet();

  const connectWallet = () => {
    aptosWallet.connect(PosteroWalletName);
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
                  <div className="ml-10 flex items-baseline space-x-4">
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
