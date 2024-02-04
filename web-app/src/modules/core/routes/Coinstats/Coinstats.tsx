import { useEffect, useState } from "react";
import Money from "../../../ui/Money";
import ChartComponent from "./ChartComponent";
import StatItem from "./components/StatItem";
import StatsContainer from "./components/StatsContainer";

const getData = async () => {
  const res = await fetch(`${import.meta.env.VITE_API_HOST}/stats`);
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
        setData(await getData());
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div className="p-4">
      {(!data && loading) && <div>loading...</div>}

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

              <ChartComponent
                type="PieChart"
                title="Total Supply"
                data={data.supplyAllocation}
              />

              <ChartComponent
                type="PieChart"
                title="Community capital"
                data={data.communityCapital}
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
            <h3 className="text-base font-semibold text-gray-900">
              Validators
            </h3>

            <StatsContainer columns={2}>
              <StatItem
                name="Epoch reward"
                secondary={`${data.lastEpochReward.percentage.toFixed(4)}%`}
              >
                <Money>{data.lastEpochReward.nominal}</Money>
              </StatItem>

              <StatItem name="Clearing Bid">
                {`${data.currentClearingBid}%`}
              </StatItem>
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

          <div className="mt-10">
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
          </div>

          <div className="mt-5">
            <h3 className="text-base font-semibold text-gray-900">
              Slow Wallets
            </h3>

            <StatsContainer columns={3}>
              <StatItem name="Slow wallets count">
                {`${data.currentSlowWalletsCount.toLocaleString()}`}
              </StatItem>
              <StatItem
                name="Locked on Slow wallets"
                secondary={`${data.currentLockedOnSlowWallets.percentage.toFixed(
                  4
                )}%`}
              >
                <Money>{data.currentLockedOnSlowWallets.nominal}</Money>
              </StatItem>

              <StatItem
                name="Last Epoch Unlocked"
                secondary={`${data.lastEpochTotalUnlockedAmount.percentage.toFixed(
                  4
                )}%`}
              >
                <Money>{data.lastEpochTotalUnlockedAmount.nominal}</Money>
              </StatItem>
            </StatsContainer>

            <dl className="mt-5 grid grid-cols-1 gap-5">
              <ChartComponent
                type="LineAndBarChart"
                title="Slow wallets count Over Time"
                data={data.slowWalletsCountOverTime}
              />
            </dl>
          </div>
        </>
      )}
    </div>
  );
};

export default Coinstats;
