import { FC, useEffect, useState } from 'react';
import clsx from 'clsx';
import axios from 'axios';
import ReactECharts from 'echarts-for-react';

import { config } from '../../../../config';

interface Props {
  address: string;
}

const HistoricalBalance: FC<Props> = ({ address }) => {
  const [options, setOptions] = useState<any>();

  useEffect(() => {
    const load = async () => {
      // Use relative URL which will be handled by the proxy in development
      const apiUrl = process.env.NODE_ENV === 'development'
        ? `/api/historical-balance/${address}`  // Will be proxied
        : `${config.dataApiHost}/historical-balance/${address}`;

      const res = await axios<{
        timestamp: number[];
        balance: number[];
        unlocked: number[];
        locked: number[];
      }>({
        url: apiUrl,
      });

      const historicalBalance = res.data.balance.map((it, index) => [
        res.data.timestamp[index] * 1e3,
        it / 1e6,
      ]);
      const slowWalletUnlocked = res.data.unlocked.map((it, index) => [
        res.data.timestamp[index] * 1e3,
        it / 1e6,
      ]);
      const slowWalletLocked = res.data.locked.map((it, index) => [
        res.data.timestamp[index] * 1e3,
        it / 1e6,
      ]);

      setOptions({
        animation: false,
        color: ['#DAE1FA', '#5A68FF', '#9BAEF1'],
        title: {
          text: 'Balance over time',
          left: 'center',
          top: 20,
          textStyle: {
            fontSize: 16,
            fontWeight: 'bold',
          },
        },
        grid: { top: 60, right: 30, bottom: 80, left: 120 },
        xAxis: {
          type: 'time',
        },
        yAxis: {
          type: 'value',
          min: 'dataMin',
        },
        series: [
          {
            name: 'Balance',
            data: historicalBalance,
            type: 'line',
            showSymbol: false,
            lineStyle: {
              width: 0,
            },
          },
          {
            stack: 'Total',
            name: 'Unlocked',
            data: slowWalletUnlocked,
            type: 'line',
            areaStyle: {
              color: '#5A68FF',
            },
            lineStyle: {
              width: 0,
            },
            showSymbol: false,
          },
          {
            stack: 'Total',
            name: 'Locked',
            data: slowWalletLocked,
            type: 'line',
            areaStyle: {
              color: '#9BAEF1',
            },
            lineStyle: {
              width: 0,
            },
            showSymbol: false,
          },
        ],
        tooltip: {
          trigger: 'axis',
        },
        dataZoom: [
          {
            type: 'inside',
            start: 0,
            end: 100,
          },
          {
            start: 0,
            end: 100,
          },
        ],
      });
    };
    load();
  }, [address]);

  return (
    <>
      {options && (
        <div
          className={clsx(
            'w-full rounded-md shadow overflow-hidden h-[500px]',
            'ring-1 ring-black ring-opacity-5',
            'bg-white',
          )}
        >
          <ReactECharts option={options} style={{ height: '100%', width: '100%' }} />
        </div>
      )}
    </>
  );
};

export default HistoricalBalance;
