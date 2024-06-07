import { format as d3Format } from 'd3-format';
import { FC, useEffect, useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import useAptos from '../../../aptos';
import {
  useLedgerInfo,
  useTotalSupply,
  useValidatorSet,
  useAccountsStats,
  useTotalTransactions,
} from '../../../ol';
import Countdown from '../../../ui/Countdown';
import PriceStats from './Stats/PriceStats';
import NodeMap from '../../../ui/NodeMap';

const Stats: FC = () => {
  const aptos = useAptos();

  const [nextEpoch, setNextEpoch] = useState<Date>();
  const [nextEpochDate, setNextEpochDate] = useState<string>();

  const totalSupply = useTotalSupply();
  const validatorSet = useValidatorSet();
  const ledgerInfo = useLedgerInfo();
  const accountsStats = useAccountsStats();
  const totalTransactions = useTotalTransactions();

  const dev = location.search.includes('dev=true');

  useEffect(() => {
    let timeout: NodeJS.Timeout | undefined = undefined;
    const load = async () => {
      timeout = undefined;

      const blockResource = await aptos.getAccountResource('0x1', '0x1::block::BlockResource');
      const epochIntervalMs = parseInt((blockResource.data as any).epoch_interval, 10) / 1_000;

      const events = await aptos.getEventsByEventHandle(
        '0x1',
        '0x1::reconfiguration::Configuration',
        'events',
        { limit: 1 },
      );
      const lastEvent = events[0];
      const lastEpochBlock = await aptos.getBlockByVersion(
        parseInt((lastEvent as any).version, 10),
      );
      const lastEpochBlockTimestamp = Math.floor(
        parseInt(lastEpochBlock.block_timestamp, 10) / 1_000,
      );
      const nextEpoch = new Date(lastEpochBlockTimestamp + epochIntervalMs);

      setNextEpoch(nextEpoch);
      setNextEpochDate(
        new Intl.DateTimeFormat(undefined, {
          dateStyle: 'short',
          timeStyle: 'long',
        }).format(nextEpoch),
      );

      timeout = setTimeout(() => load(), epochIntervalMs);
    };
    load();

    return () => {
      if (timeout !== undefined) {
        clearTimeout(timeout);
        timeout = undefined;
      }
    };
  }, []);

  return (
    <dl className="flex flex-col gap-[4px]">
      {dev && (
        <div className="grid grid-cols-1 gap-[4px] md:grid-cols-2">
          <PriceStats />

          <div className="bg-[#F5F5F5] p-5 relative overflow-hidden">
            <div className="flex flex-col gap-4 relative z-20">
              <span className="text-xl font-bold">Validator Map</span>
              <div className="grid grid-cols-2 md:grid-cols-1 gap-2">
                {/* @TODO: DUMMY DATA */}
                <div className="flex flex-col">
                  <span className="text-lg font-extralight">Total Validators</span>
                  <span className="text-xl font-medium">15</span>
                </div>
                {/* @TODO: DUMMY DATA */}
                <div className="flex flex-col">
                  <span className="text-lg font-extralight">Eligible</span>
                  <span className="text-xl font-medium">70</span>
                </div>
              </div>
            </div>
            <div className="md:absolute md:top-[-80px] md:right-[-90px] md:h-[300px] md:w-[600px] z-10">
              <NodeMap />
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-[4px] md:grid-cols-4">
        <div className="flex flex-col bg-[#F5F5F5] p-5 gap-2">
          <span className="text-sm font-medium text-[#525252]">Total Supply</span>
          <span
            className={`text-2xl md:text-3xl tracking-tight text-[#141414] h-8 rounded ${
              !totalSupply ? 'animate-pulse bg-gray-300 text-2xl space-y-4' : ''
            }`}
          >
            {totalSupply ? `${d3Format('.3f')(Math.floor(totalSupply.amount / 1e6) / 1e3)}B` : null}
          </span>
        </div>

        <Link
          to={ledgerInfo ? `/blocks/${ledgerInfo.block_height}` : '/'}
          className="flex flex-col bg-[#F5F5F5] p-5 gap-2"
        >
          <span className="text-sm font-medium text-[#525252]">Block Height</span>
          <span
            className={`hover:underline text-2xl md:text-3xl tracking-tight text-[#141414] h-8 rounded ${
              !ledgerInfo ? 'animate-pulse bg-gray-300 space-y-4' : ''
            }`}
          >
            {ledgerInfo ? parseInt(ledgerInfo.block_height, 10).toLocaleString() : null}
          </span>
        </Link>

        <div className="flex flex-col bg-[#F5F5F5] p-5 gap-2">
          <span className="text-sm font-medium text-[#525252]">Epoch</span>
          <span
            className={`text-2xl md:text-3xl tracking-tight text-[#141414] h-8 rounded ${
              !ledgerInfo ? 'animate-pulse bg-gray-300 space-y-4' : ''
            }`}
          >
            {ledgerInfo ? parseInt(ledgerInfo.epoch, 10).toLocaleString() : null}
          </span>
        </div>

        <NavLink to="/validators" className="flex flex-col bg-[#F5F5F5] p-5 gap-2">
          <span className="text-sm font-medium text-[#525252]">Validators</span>
          <span
            className={`hover:underline text-2xl md:text-3xl tracking-tight text-[#141414] h-8 rounded ${
              !validatorSet ? 'animate-pulse bg-gray-300 space-y-4' : ''
            }`}
          >
            {validatorSet ? validatorSet.active_validators.length : null}
          </span>
        </NavLink>

        <div className="flex flex-col bg-[#F5F5F5] p-5">
          <span className="text-sm font-medium text-[#525252]">
            Next Epoch
            <div
              className={`text-xs text-gray-400 h-4 rounded ${
                !nextEpoch ? 'animate-pulse bg-gray-300 space-y-4' : ''
              }`}
            >
              {nextEpoch ? nextEpochDate : null}
            </div>
          </span>
          <span
            className={`text-2xl md:text-3xl tracking-tight text-[#141414] h-8 rounded ${
              !nextEpoch ? 'animate-pulse bg-gray-300 space-y-4' : ''
            }`}
          >
            {nextEpoch ? <Countdown date={nextEpoch} /> : null}
          </span>
        </div>

        {dev && (
          <>
            <div className="flex flex-col bg-[#F5F5F5] p-5 gap-2">
              <span className="text-sm font-medium text-[#525252]">Transactions</span>
              <span
                className={`text-2xl md:text-3xl tracking-tight text-[#141414] h-8 rounded ${
                  !totalTransactions ? 'animate-pulse bg-gray-300 text-2xl space-y-4' : ''
                }`}
              >
                {totalTransactions?.toLocaleString()}
              </span>
            </div>

            <div className="flex flex-col bg-[#F5F5F5] p-5 gap-2">
              <span className="text-sm font-medium text-[#525252]">Total Accounts</span>
              <span
                className={`text-2xl md:text-3xl tracking-tight text-[#141414] h-8 rounded ${
                  !accountsStats ? 'animate-pulse bg-gray-300 text-2xl space-y-4' : ''
                }`}
              >
                {accountsStats ? accountsStats.totalAccounts?.toLocaleString() : null}
              </span>
            </div>
          </>
        )}
      </div>
    </dl>
  );
};

export default Stats;
