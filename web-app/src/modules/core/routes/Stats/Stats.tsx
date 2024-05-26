import { useEffect, useState } from 'react';
import ReactECharts from 'echarts-for-react';

import { config } from '../../../../config';
import Money from '../../../ui/Money';
import ChartComponent from './ChartComponent';
import StatItem from './components/StatItem';
import StatsContainer from './components/StatsContainer';
import Page from '../../../ui/Page';

const getData = async () => {
  const res = await fetch(`${config.apiHost}/stats`);
  const data = await res.json();
  return data;
};

const Coinstats = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>();

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);

        const data = await getData();

        const lockedCoins = data.lockedCoins.map((it: [number, number]) => [it[0] * 1e3, it[1]]);
        setData({ ...data, lockedCoins });
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <Page __deprecated_grayBg>
      {!data && loading && <div>loading...</div>}

      {data && (
        <>
          <div>
            <h3 className="text-base font-semibold text-gray-900">Supply</h3>

            <StatsContainer columns={2}>
              <StatItem
                name="Circulating supply"
                secondary={`${data.circulatingSupply.percentage.toFixed(4)}%`}
              >
                <Money>{data.circulatingSupply.nominal}</Money>
              </StatItem>

              <StatItem
                name="Total burned since Genesis"
                secondary={`${data.totalBurned.percentage.toFixed(4)}%`}
              >
                <Money>{data.totalBurned.nominal}</Money>
              </StatItem>
            </StatsContainer>

            <dl className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-3">
              <ChartComponent
                type="PieChart"
                title="Individuals capital"
                data={data.individualsCapital}
              />

              <ChartComponent type="PieChart" title="Total Supply" data={data.supplyAllocation} />

              <ChartComponent
                type="PieChart"
                title="Community capital"
                data={data.communityCapital}
              />
            </dl>

            <dl className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-2">
              <ChartComponent
                type="BarChartSupplyConcentration"
                title="Individuals Liquid Capital Concentration"
                data={data.liquidSupplyConcentration}
              />
              <ChartComponent
                type="BarChartLockedConcentration"
                title="Slow Wallets Locked Capital Concentration"
                data={data.lockedSupplyConcentration}
              />
            </dl>

            <dl className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-2">
              <ChartComponent
                type="BarChart"
                title="Accounts on chain over time"
                data={data.accountsOnChainOverTime}
              />
              <ChartComponent
                type="LineAndAreaChart"
                title="Total Burned Over Time"
                data={data.burnOverTime}
              />
            </dl>
          </div>

          <div className="mt-10">
            <h3 className="text-base font-semibold text-gray-900">Validators</h3>
            <StatsContainer columns={3}>
              <StatItem
                name="Infra escrow account balance"
                secondary={`${data.infrastructureEscrow.percentage.toFixed(3)}%`}
              >
                <Money>{data.infrastructureEscrow.nominal}</Money>
              </StatItem>
              <StatItem
                name="Epoch reward"
                secondary={`${data.lastEpochReward.percentage.toFixed(4)}%`}
              >
                <Money>{data.lastEpochReward.nominal}</Money>
              </StatItem>

              <StatItem name="Clearing Bid">{`${data.currentClearingBid}%`}</StatItem>
            </StatsContainer>

            <dl className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-2">
              <ChartComponent
                type="LineChart"
                title="Rewards Over Time"
                data={data.rewardsOverTime}
              />
              <ChartComponent
                type="LineChart"
                title="Clearing bid Over Time"
                data={data.clearingBidoverTime}
              />
            </dl>
          </div>

          {/* <div className="mt-10">
            <h3 className="text-base font-semibold text-gray-900">
              Community Wallets
            </h3>

            <StatsContainer columns={1}>
              <StatItem
                name="Community Wallets Balance"
                secondary={`${data.communityWalletsBalance.percentage.toFixed(
                  4
                )}%`}
              >
                <Money>{data.communityWalletsBalance.nominal}</Money>
              </StatItem>
            </StatsContainer>

            <dl className="mt-5 grid grid-cols-1 gap-5">
              <ChartComponent
                type="PieChart"
                title="Community wallets breakdown"
                data={data.communityWalletsBalanceBreakdown}
              />
            </dl>
          </div> */}

          <div className="mt-5">
            <h3 className="text-base font-semibold text-gray-900">Slow Wallets</h3>

            <StatsContainer columns={3}>
              <StatItem name="Slow wallets count">
                {`${data.currentSlowWalletsCount.toLocaleString()}`}
              </StatItem>
              <StatItem
                name="Locked on Slow wallets"
                secondary={`${data.currentLockedOnSlowWallets.percentage.toFixed(4)}%`}
              >
                <Money>{data.currentLockedOnSlowWallets.nominal}</Money>
              </StatItem>

              <StatItem
                name="Last Epoch Unlocked"
                secondary={`${data.lastEpochTotalUnlockedAmount.percentage.toFixed(4)}%`}
              >
                <Money>{data.lastEpochTotalUnlockedAmount.nominal}</Money>
              </StatItem>
            </StatsContainer>

            <dl className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-2">
              <ChartComponent
                type="LineAndBarChart"
                title="Slow wallets count Over Time"
                data={data.slowWalletsCountOverTime}
              />

              <div className="relative overflow-hidden rounded-lg bg-white px-4 pb-12 pt-5 shadow sm:px-6 sm:pt-6">
                <dt className="text-sm font-medium leading-6 text-gray-500">
                  Supply locked in slow wallets
                </dt>
                <dd className="mt-2">
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
                          data: data.lockedCoins,
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
                </dd>
              </div>
            </dl>
          </div>
          <div className="mt-5">
            <h3 className="text-base font-semibold text-gray-900 mb-5">Top 100 Liquid accounts</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Address
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Liquid Balance
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      % of Circulating Supply
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {data.topAccounts.map((account: { address: string; unlockedBalance: number; percentOfCirculating: number }, index: number) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        <a
                          href={`https://0l.fyi/accounts/${account.address}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-500 hover:text-blue-700"
                        >
                          {account.address}
                        </a>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <Money>{account.unlockedBalance}</Money>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {account.percentOfCirculating.toFixed(4)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </Page>
  );
};

export default Coinstats;
