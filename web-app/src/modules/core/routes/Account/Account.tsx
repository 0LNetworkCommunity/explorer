import { FC, useEffect, useState } from "react";
import Page from "../../../ui/Page/Page";
import { NavLink, Outlet, useParams } from "react-router-dom";
import clsx from "clsx";
import useAptos from "../../../aptos";

const Account: FC = () => {
  const accountAddress = useParams().accountAddress!;
  const aptos = useAptos();

  const [balance, setBalance] = useState('');
  const [slowWallet, setSlowWallet] = useState('');

  const tabs = [
    { name: 'Overview', to: `/accounts/${accountAddress}` },
    { name: 'Transactions', to: `/accounts/${accountAddress}/transactions` },
    { name: 'Resources', to: `/accounts/${accountAddress}/resources` },
    { name: 'Modules', to: `/accounts/${accountAddress}/modules` },
  ];

  useEffect(() => {
    const load = async () => {
      const res = await aptos.getAccountResource(accountAddress, '0x1::coin::CoinStore<0x1::libra_coin::LibraCoin>');
      const balance = (res.data as any).coin.value / 1e6;
      setBalance(`${balance.toLocaleString()}`);
    };
    load();
  }, []);

  useEffect(() => {
    const load = async () => {
      const res = await aptos.getAccountResource(accountAddress, '0x1::slow_wallet::SlowWallet');
      const data = res.data as { transferred: string; unlocked: string };

      const transferred = (parseInt(data.transferred, 10) / 1e6).toLocaleString();
      const unlocked = (parseInt(data.unlocked, 10) / 1e6).toLocaleString();

      setSlowWallet(`Transferred: ${transferred} | Unlocked: ${unlocked}`);

    };
    load();
  }, []);

  return (
    <Page title={`Account: ${accountAddress}`}>
      <div>
        {`Balance: ${balance}`}
        {slowWallet && ` | ${slowWallet}`}
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
                    ? "border-primary-500 text-primary-600"
                    : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700",
                  "group inline-flex items-center border-b-2 py-4 px-1 text-sm font-medium"
                )
              }
            >
              {tab.name}
            </NavLink>
          ))}
        </nav>
      </div>
      <div className="mt-6">
        <Outlet />
      </div>
    </Page>
  );
};

export default Account;
