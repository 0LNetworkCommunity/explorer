import React from 'react';
import './Coinstats.css';
import mockedData from './mockedData';

import KPIComponent from './components/KPIComponent';
import BarChart from './components/BarChart';
import PieChart from './components/PieChart';
import LineAndBarChart from './components/LineAndBarChart';
import LineAndAreaChart from './components/LineAndAreaChart';
import LineChart from './components/LineChart';
import StackedBarChart from './components/StackedBarChart';
import StackedAreaChart from './components/StackedAreaChart';


const mockData = {
  supply: {
    kpis: [
      // { value: mockedData.changeInCirculatingSupply, title: "Circulating supply change from previous epoch", unit: "Ƚ" }, // last epoch delta
      { value: mockedData.circulatingSupply, title: "Circulating supply", unit: "Ƚ" },
      // { value: mockedData.lastEpochBurn, title: "Last Epoch Burn", unit: "Ƚ" },
    ],
    chartRows: [
      [
        { type: "PieChart", data: mockedData.individualsCapital, title: "Individuals capital" },
        { type: "PieChart", data: mockedData.supplyAllocation, title: "Total Supply" },
        { type: "PieChart", data: mockedData.communityCapital, title: "Community capital" }
      ],
      [
        { type: "StackedAreaChart", data: mockedData.dailyTransactedVolume, title: "Daily transfer volume by account category" },
        { type: "BarChart", data: mockedData.accountsOnChainOverTime, title: "Accounts on chain over time" }
      ],
      [
        { type: "StackedBarChart", data: mockedData.totalSupplyAllocationOverTime, title: "Total Supply Allocation Over Time" }
      ],
      [
        { type: "LineAndAreaChart", data: mockedData.burnOverTime, title: "Burn Over Time" },
        { type: "LineAndAreaChart", data: mockedData.circulatingSupplyOverTime, title: "Circulating Supply Over Time" },

      ],
    ]
  },
  validators: {
    kpis: [
      { value: mockedData.lastEpochRewards, title: "Epoch reward", unit: "Ƚ" },
      { value: mockedData.currentWinningBid, title: "Winning Bid", unit: "Ƚ" },
      { value: mockedData.currentSeatCount, title: "Seat Count" }
    ],
    chartRows: [
      [
        { type: "BarChart", data: mockedData.seatsOverTime, title: "Seats Over Time" },
        { type: "LineChart", data: mockedData.rewardsOverTime, title: "Rewards Over Time" }
      ]
    ]
  },
  communityWallets: {
    kpis: [
      { value: mockedData.communityWalletsBalance, title: "Community Wallets Balance", unit: "Ƚ" },
      { value: mockedData.communityWalletsChange, title: "Community Wallets change from previous epoch", unit: "Ƚ" }
    ],
    chartRows: [
      [
        { type: "LineChart", data: mockedData.communityWalletsBalanceOverTime, title: "Community wallets balance Over Time" },
        { type: "PieChart", data: mockedData.communityWalletsSupply, title: "Community wallets breakdown" }
      ]
    ]
  },
  slowWallets: {
    kpis: [
      { value: mockedData.currentSlowWalletsCount, title: "Slow wallets count" },
      { value: mockedData.currentLockedOnSlowWallets, title: "Locked on Slow wallets", unit: "Ƚ" },
      { value: mockedData.lastEpochUnlocked, title: "Last Epoch Unlocked", unit: "Ƚ" },
    ],
    chartRows: [
      [
        { type: "LineChart", data: mockedData.unlockedOverTime, title: "Unlock Over Time" },
        { type: "LineAndBarChart", data: mockedData.slowWalletsOverTime, title: "Slow wallets count Over Time" },
      ]
    ]
  }
};


const ChartComponent = ({ type, data, title }) => {
  const [chartReady, setChartReady] = React.useState(false);
  const chartRef = React.useRef(null);

  React.useEffect(() => {
    if (chartRef.current && chartRef.current.clientHeight && chartRef.current.clientWidth) {
      setChartReady(true);
    }
  }, []);

  const renderChart = () => {
    switch (type) {
      case 'BarChart':
        return <BarChart data={data} title={title} />;
      case 'PieChart':
        return <PieChart data={data} title={title} />;
      case 'LineChart':
        return <LineChart data={data} title={title} />;
      case 'LineAndBarChart':
        return <LineAndBarChart data={data} title={title} />;
      case 'LineAndAreaChart':
        return <LineAndAreaChart data={data} title={title} />;
      case 'StackedBarChart':
        return <StackedBarChart data={data} title={title} />;
      case 'StackedAreaChart':
        return <StackedAreaChart data={data} categories={data.categories} />;
      default:
        return null;
    }
  };

  return (
    <div ref={chartRef} className="chart-item">
      {chartReady && renderChart()}
    </div>
  );
};


const Section = ({ title, data }) => {
  const formatValue = (value) => {
    if (typeof value === 'object' && value !== null) {
      // Format the value as a string combining nominal and percentage
      const formattedValue = `${value.nominal.toLocaleString()} (${value.percentage.toFixed(4)}%)`;
      return formattedValue;
    }
    // Format the value directly if it's not an object
    return value.toLocaleString();
  };

  return (
    <div className="section-container">
      <h2 className="section-title">{title}</h2>
      {data.kpis && (
        <div className="kpi-row">
          {data.kpis.map((kpi, index) => (
            <KPIComponent
              key={index}
              title={kpi.title}
              value={formatValue(kpi.value)}
              unit={kpi.unit}
            />
          ))}
        </div>
      )}
      {data.chartRows && data.chartRows.map((row, rowIndex) => (
        <div key={rowIndex} className="charts-row">
          {row.map((chart, chartIndex) => (
            <ChartComponent key={chartIndex} type={chart.type} data={chart.data} title={chart.title} />
          ))}
        </div>
      ))}
    </div>
  );
};

const Coinstats = () => {
  return (
    <div className="dashboard-container">
      <Section title="Supply" data={mockData.supply} />
      <Section title="Validators" data={mockData.validators} />
      <Section title="Community Wallets" data={mockData.communityWallets} />
      <Section title="Slow Wallets" data={mockData.slowWallets} />
    </div>
  );
};

export default Coinstats;