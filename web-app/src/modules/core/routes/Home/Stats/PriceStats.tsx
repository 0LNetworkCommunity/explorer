import { FC } from 'react';
import { Link } from 'react-router-dom';
import clsx from 'clsx';

import Logo from '../../../../ui/Logo/Logo';
import { OL_COINGECKO_URL } from '../../../../../contants';
import CoingeckoLogo from '../../../../assets/images/coingecko.png';

const PriceStats: FC = () => {

  const dev = location.search.includes('dev=true');

  const priceIsIncreasing = true;

  const upIcon = (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      stroke-width="1.5"
      stroke="currentColor"
      className="text-[#079455] h-5 w-5"
    >
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        d="M2.25 18 9 11.25l4.306 4.306a11.95 11.95 0 0 1 5.814-5.518l2.74-1.22m0 0-5.94-2.281m5.94 2.28-2.28 5.941"
      />
    </svg>
  );

  const downIcon = (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      stroke-width="1.5"
      stroke="currentColor"
      className="text-red-600 h-5 w-5"
    >
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        d="M2.25 6 9 12.75l4.286-4.286a11.948 11.948 0 0 1 4.306 6.43l.776 2.898m0 0 3.182-5.511m-3.182 5.51-5.511-3.181"
      />
    </svg>
  );

  return (
    <div className="bg-[#F5F5F5] p-5">
      <div className="flex-col md:flex-row flex justify-between">
        <div className="flex items-end">
          <Logo color="#CD3B42" className="h-6 w-6 mr-2" withText={false} />
          <span className="font-medium text-base mr-1">0L Network</span>
          <span className="text-sm font-normal pb-[1px]">LIBRA</span>
        </div>
        <div className="justify-end md:justify-normal flex gap-2">
          <a
            href={OL_COINGECKO_URL}
            className="text-base font-normal text-[#CD3B42] underline hover:text-red-700 transition-colors duration-150"
            target="_blank"
            rel="noopener"
          >
            View on CoinGecko
          </a>
          <img src={CoingeckoLogo} alt="Coingecko logo" />
        </div>
      </div>
      {/* @TODO: DUMMY DATA */}
      {dev && (
        <div className="flex gap-0.5 items-end mt-2">
          <span className="text-4xl	font-medium mr-2">$0.00000</span>
          {priceIsIncreasing ? upIcon : downIcon}
          <span
            className={clsx(
              `flex gap-2 font-medium text-sm ${
                priceIsIncreasing ? `text-[#079455]` : `text-red-600`
              }`,
            )}
          >
            2.57%
          </span>
        </div>
      )}
      {/* @TODO: DUMMY DATA */}
      {dev && (
        <>
          <div className="flex flex-col py-5 gap-2 border-b border-[#E5E5E5]">
            <div className="flex justify-between items-center">
              <span className="text-lg font-extralight">Marketcap</span>
              <span className="text-lg font-medium">$000,000,000</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-lg font-extralight">Trading Volume (24hrs)</span>
              <span className="text-lg font-medium">$000,000</span>
            </div>
          </div>
          {/* @TODO: DUMMY DATA */}
          <div className="grid grid-cols-2 pt-5 gap-2">
            <div className="flex flex-col items-start">
              <span className="text-lg font-extralight">Marketcap</span>
              <span className="text-lg font-medium">$000,000,000</span>
            </div>
            <div className="flex flex-col items-start">
              <span className="text-lg font-extralight">Trading Volume (24hrs)</span>
              <span className="text-lg font-medium">$000,000</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default PriceStats;
