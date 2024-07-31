import { FC } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import clsx from 'clsx';

import Page from '../../../ui/Page';
import CommunityWalletsStats from './components/CommunityWalletsStats';

const CommunityWallets: FC = () => {
  return (
    <Page>
      <h1 className="font-space-grotesk text-3xl md:text-4xl font-medium leading-[44px] tracking-[-0.02em] text-left mt-6 mb-6">
        Community Wallets
      </h1>
      <section className="my-2 flow-root">
        <CommunityWalletsStats />
        <div className="py-8">
          <ul className="inline-flex border border-[#D6D6D6] rounded-md overflow-hidden shadow-sm mb-6 divide-x">
            <li>
              <NavLink
                to="/community-wallets"
                end
                className={({ isActive }) =>
                  clsx(
                    'block px-4 py-2',
                    isActive ? 'bg-[var(--Colors-Background-bg-active,#FAFAFA)]' : 'bg-white',
                  )
                }
              >
                Wallets
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/community-wallets/details"
                className={({ isActive }) =>
                  clsx(
                    'block px-4 py-2',
                    isActive ? 'bg-[var(--Colors-Background-bg-active,#FAFAFA)]' : 'bg-white',
                  )
                }
              >
                Details
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/community-wallets/transactions"
                className={({ isActive }) =>
                  clsx(
                    'block px-4 py-2',
                    isActive ? 'bg-[var(--Colors-Background-bg-active,#FAFAFA)]' : 'bg-white',
                  )
                }
              >
                Transactions
              </NavLink>
            </li>
          </ul>

          <Outlet />
        </div>
      </section>
    </Page>
  );
};

export default CommunityWallets;
