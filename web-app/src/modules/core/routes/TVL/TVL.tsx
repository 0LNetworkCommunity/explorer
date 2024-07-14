import ReactECharts from 'echarts-for-react';
import { useEffect, useState } from 'react';
import { lockedCoins } from './data';

export function TVL() {
  const [totalSupply, setTotalSupply] = useState<[number, number][]>([]);

  useEffect(() => {
    const load = async () => {
      const res = await fetch('http://localhost:4000/total-supply');
      const body = await res.json();
      setTotalSupply(body);
    };
    load();
  }, []);

  return (
    <div>
      <h1>TVL</h1>

      <ReactECharts
        option={{
          animation: false,
          grid: { top: 28, right: 30, bottom: 80, left: 120 },
          xAxis: {
            type: 'time',
          },
          yAxis: {
            type: 'value',
            scale: true,
          },
          series: [
            {
              name: 'Total Supply',
              data: totalSupply,
              type: 'line',
            },
            {
              name: 'Locked Coins',
              data: lockedCoins,
              type: 'line',
            },
          ],
          tooltip: {
            trigger: 'axis',
          },
          dataZoom: [
            {
              type: 'inside',
              start: 90,
              end: 100,
            },
            {},
          ],
        }}
        style={{ height: 400 }}
      />
    </div>
  );
}
