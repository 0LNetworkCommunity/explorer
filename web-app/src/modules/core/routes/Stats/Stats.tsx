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

        setData(data);
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
        <div className="pb-8">
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
                title="User allocation"
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
                        axisLabel: {
                          formatter: '{MMM} {dd}, {yyyy}'
                        },
                        // Fix for timestamps showing January 1970
                        min: function(value: any) {
                          // Find a reasonable minimum date range (skip extreme values)
                          return value.min > 946684800 ? value.min : 946684800; // Jan 1, 2000 as fallback
                        }
                      },
                      yAxis: {
                        type: 'value',
                        scale: true,
                        name: 'Locked Amount',
                        axisLabel: {
                          formatter: function(value: any) {
                            return Math.round(value).toLocaleString();
                          }
                        }
                      },
                      series: [
                        {
                          data: data.lockedCoins.map((point: any) => {
                            // Ensure timestamps are in milliseconds for ECharts
                            return [point[0] * 1000, point[1]];
                          }),
                          type: 'line',
                          name: 'Locked Supply',
                        },
                      ],
                      tooltip: {
                        trigger: 'axis',
                        formatter: function(params: any) {
                          const point = params[0];
                          // The timestamp is already in milliseconds in the mapped data
                          const date = new Date(point.value[0]);

                          // Format number with commas and drop decimal places
                          const formattedAmount = Math.round(point.value[1]).toLocaleString();

                          return `${date.toLocaleDateString()}<br/>Locked Amount: ${formattedAmount}`;
                        }
                      },
                      dataZoom: [
                        {
                          type: 'inside',
                          start: 0,
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
        </div>
      )}
    </Page>
  );
};

export default Coinstats;
