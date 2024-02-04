import { useEffect, useState } from 'react';
import './Coinstats.css';
import Section from './Section';

const getData = async () => {
  const res = await fetch(`${import.meta.env.VITE_API_HOST}/stats`);
  const data = await res.json();

  return {
    supply: {
      kpis: [
        // { value: mockedData.changeInCirculatingSupply, title: "Circulating supply change from previous epoch", unit: "Ƚ" }, // last epoch delta
        {
          value: data.circulatingSupply,
          title: "Circulating supply",
          unit: "Ƚ",
        },
        {
          value: data.totalBurned,
          title: "Total burned since Genesis",
          unit: "Ƚ",
        },
        // { value: mockedData.lastEpochBurn, title: "Last Epoch Burn", unit: "Ƚ" },
      ],
      chartRows: [
        [
          {
            type: "PieChart",
            data: data.individualsCapital,
            title: "Individuals capital",
          },
          {
            type: "PieChart",
            data: data.supplyAllocation,
            title: "Total Supply",
          },
          {
            type: "PieChart",
            data: data.communityCapital,
            title: "Community capital",
          },
        ],
        [
          {
            type: "BarChartSupplyConcentration",
            data: data.liquidityConcentrationLiquid,
            title: "Individuals capital concentration",
          },
          {
            type: "BarChartLockedConcentration",
            data: data.liquidityConcentrationLocked,
            title: "Individuals capital concentration",
          },
        ],
        // [
        //   {
        //     type: "StackedBarChart",
        //     data: data.totalSupplyAllocationOverTime,
        //     title: "Total Supply Allocation Over Time",
        //   },
        // ],
        [
          // {
          //   type: "StackedAreaChart",
          //   data: data.dailyTransactedVolume,
          //   title: "Daily transfer volume by account category",
          // },
          {
            type: "BarChart",
            data: data.accountsOnChainOverTime,
            title: "Accounts on chain over time",
          },
        ],
        [
          {
            type: "LineAndAreaChart",
            data: data.burnOverTime,
            title: "Total Burned Over Time",
          },
          // {
          //   type: "LineAndAreaChart",
          //   data: data.circulatingSupplyOverTime,
          //   title: "Circulating Supply Over Time",
          // },
        ],
      ],
    },
    validators: {
      kpis: [
        { value: data.lastEpochReward, title: "Epoch reward", unit: "Ƚ" },
        { value: data.currentClearingBid, title: "Clearing Bid (%)" },
        // { value: data.currentSeatCount, title: "Seat Count" },
      ],
      chartRows: [
        [
          // {
          //   type: "BarChart",
          //   data: data.seatsOverTime,
          //   title: "Seats Over Time",
          // },
          {
            type: "LineChart",
            data: data.rewardsOverTime,
            title: "Rewards Over Time",
          },
          {
            type: "LineChart",
            data: data.clearingBidoverTime,
            title: "Clearing bid Over Time",
          },
        ],
      ],
    },
    communityWallets: {
      kpis: [
        {
          value: data.communityWalletsBalance,
          title: "Community Wallets Balance",
          unit: "Ƚ",
        },
        // {
        //   value: data.communityWalletsChange,
        //   title: "Community Wallets change from previous epoch",
        //   unit: "Ƚ",
        // },
      ],
      chartRows: [
        [
          // {
          //   type: "LineChart",
          //   data: data.communityWalletsBalanceOverTime,
          //   title: "Community wallets balance Over Time",
          // },
          {
            type: "PieChart",
            data: data.communityWalletsBalanceBreakdown,
            title: "Community wallets breakdown",
          },
        ],
      ],
    },
    slowWallets: {
      kpis: [
        { value: data.currentSlowWalletsCount, title: "Slow wallets count" },
        {
          value: data.currentLockedOnSlowWallets,
          title: "Locked on Slow wallets",
          unit: "Ƚ",
        },
        {
          value: data.lastEpochTotalUnlockedAmount,
          title: "Last Epoch Unlocked",
          unit: "Ƚ",
        },
      ],
      chartRows: [
        [
          // {
          //   type: "LineChart",
          //   data: data.unlockedOverTime,
          //   title: "Unlock Over Time",
          // },
          {
            type: "LineAndBarChart",
            data: data.slowWalletsCountOverTime,
            title: "Slow wallets count Over Time",
          },
        ],
      ],
    },
  };
};

const Coinstats = () => {
  const [data, setData] = useState<any>();

  useEffect(() => {
    getData().then(setData);
  }, []);

  if (!data) {
    return null;
  }

  return (
    <div className="dashboard-container">
      <Section title="Supply" data={data.supply} />
      <Section title="Validators" data={data.validators} />
      <Section title="Community Wallets" data={data.communityWallets} />
      <Section title="Slow Wallets" data={data.slowWallets} />
    </div>
  );
};

export default Coinstats;