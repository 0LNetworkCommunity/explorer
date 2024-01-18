import React from 'react';
import Page from '../../../ui/Page';
import ReactECharts from 'echarts-for-react'
import { useLedgerInfo, useTotalSupply, useValidatorSet } from '../../../ol';
import './Coinstats.css';
import KPIComponent from './components/KPIComponent';
import PieChart from './components/PieChart';
import LineChart from './components/LineChart';
import StackedBarChart from './components/StackedBarChart';

const data = {
  currentTotalSupply: "Implement me"
}

const mockData = {
  lastEpochBurn: { nominal: 500000, percentage: 0.00005 },
  lastEpochReards: { nominal: 193211, percentage: 0.000019 },
  burnOverTime: [
    { epoch: 1, value: 418674 },
    { epoch: 2, value: 431909 },
    { epoch: 3, value: 483166 },
    { epoch: 4, value: 503020 },
    { epoch: 5, value: 471029 },
    { epoch: 6, value: 520192 },
    { epoch: 7, value: 580000 },
    { epoch: 8, value: 620000 }
  ],
  locked: { nominal: 11520009236, percentage: 11.52 },
  lastEpochUnlocked: { nominal: 600000, percentage: 0.0006 },
  unlockedOverTime: [
    { epoch: 1, value: 550000 },
    { epoch: 2, value: 580000 },
    { epoch: 3, value: 600000 },
    { epoch: 4, value: 620000 },
    { epoch: 5, value: 640000 },
    { epoch: 6, value: 650000 },
    { epoch: 7, value: 630000 },
    { epoch: 8, value: 660000 },
  ],
  seatsOverTime: [
    { epoch: 1, value: 10 },
    { epoch: 2, value: 12 },
    { epoch: 3, value: 15 },
    { epoch: 4, value: 15 },
    { epoch: 5, value: 16 },
    { epoch: 6, value: 17 },
    { epoch: 7, value: 18 },
    { epoch: 8, value: 19 },
  ],
  supplyAllocation: [
    { name: 'Community Wallets', value: 44776366902.9375 },
    { name: 'Slow Wallets Locked', value: 7500584480.351093 },
    { name: 'Infrastructure escrow', value: 38573288582.73144 },
    { name: 'Circulating', value: 9002769502.90007 },
  ],
  // communityWalletsOverTime: [
  //   { epoch: 1, value: 1000000 },
  //   { epoch: 2, value: 1050000 },
  //   { epoch: 3, value: 1100000 },
  //   { epoch: 4, value: 1150000 },
  //   { epoch: 5, value: 1200000 },
  // ],
  reward: 4215,
  winningBid: 2703,
  seatCount: 15,
  epoch: 36,
  rewardsOverTime: [
    { epoch: 1, value: 900 },
    { epoch: 2, value: 950 },
    { epoch: 3, value: 1000 },
    { epoch: 4, value: 1050 },
    { epoch: 5, value: 1100 },
    { epoch: 6, value: 1000 },
    { epoch: 7, value: 1200 },
    { epoch: 8, value: 1150 },
  ],
  supplyAllocationOverTime: [
    { epoch: 1, CommunityWallets: 47.06, SlowWallets: 11.76, InfrastructureEscrow: 35.29, Circulating: 5.88 },
    { epoch: 2, CommunityWallets: 46.67, SlowWallets: 12.22, InfrastructureEscrow: 32.22, Circulating: 8.89 },
    { epoch: 3, CommunityWallets: 46.74, SlowWallets: 13.04, InfrastructureEscrow: 30.43, Circulating: 9.78 },
    { epoch: 4, CommunityWallets: 50.00, SlowWallets: 15.00, InfrastructureEscrow: 25.00, Circulating: 10.00 },
    { epoch: 5, CommunityWallets: 47.22, SlowWallets: 14.81, InfrastructureEscrow: 22.22, Circulating: 15.74 },
    { epoch: 6, CommunityWallets: 47.27, SlowWallets: 15.45, InfrastructureEscrow: 20.91, Circulating: 16.36 },
    { epoch: 7, CommunityWallets: 47.83, SlowWallets: 17.39, InfrastructureEscrow: 17.39, Circulating: 17.39 }
  ],
}

const Coinstats = () => {
  return (
    <div className="dashboard-container">
      <div className="kpi-row">
        <KPIComponent
          title="Last Epoch Burn"
          value={`Ƚ${mockData.lastEpochBurn.nominal.toLocaleString()} (${mockData.lastEpochBurn.percentage}%)`}
        />
        {/* <KPIComponent
          title="Last Epoch Unlocked"
          value={`Ƚ${mockData.lastEpochUnlocked.nominal.toLocaleString()} (${mockData.lastEpochUnlocked.percentage}%)`}
        /> */}
        <KPIComponent
          title="Locked"
          value={`Ƚ${mockData.locked.nominal.toLocaleString()} (${mockData.locked.percentage}%)`}
        />
        <KPIComponent
          title="Last epoch val rewards"
          value={`Ƚ${mockData.lastEpochReards.nominal.toLocaleString()} (${mockData.lastEpochReards.percentage}%)`}
        />
        {/* <KPIComponent title="Current Epoch" value={mockData.epoch} />
        <KPIComponent title="Current Reward" value={mockData.reward.toLocaleString()} unit="Ƚ" />
        <KPIComponent title="Winning Bid" value={mockData.winningBid.toLocaleString()} unit="Ƚ" />
        <KPIComponent title="Seat Count" value={mockData.seatCount} /> */}
      </div>
      <div className="charts-row">
        <div className="chart-item">
          <PieChart data={mockData.supplyAllocation} title="Supply Allocation" />
        </div>
        <div className="chart-item">
          <StackedBarChart data={mockData.supplyAllocationOverTime} title="Supply Allocation Over Time" />
        </div>
      </div>
      <div className="charts-container">
        <div className="chart-item">
          <LineChart data={mockData.burnOverTime} title="Burn Over Time" />
        </div>
        <div className="chart-item">
          <LineChart data={mockData.unlockedOverTime} title="Unlock Over Time" />
        </div>
        <div className="chart-item">
          <LineChart data={mockData.seatsOverTime} title="Seats Over Time" />
        </div>
        <div className="chart-item">
          <LineChart data={mockData.rewardsOverTime} title="Reward Over Time" />
        </div>
      </div>
    </div>
  );
};

// interface SupplyData {
//   totalSupply: number;
//   slowWallets: number;
//   validatorsPledges: number;
//   communityWallets: number;
//   circulatingSupply: number;
// }

// const KPIComponent = ({ title, value, gridColumn }) => {
//   // Use `gridColumn` to control the span of each component
//   const style = { gridColumn };
//   return (
//     <div className="kpi-container" style={style}>
//       <h3>{title}</h3>
//       <p>{value}</p>
//     </div>
//   );
// };

// const Coinstats = () => {
//   const data: SupplyData = {
//     totalSupply: 99853105268.57646,
//     slowWallets: 11119173138.69867,
//     validatorsPledges: 29713541073.5736,
//     communityWallets: 42033107801.54107,
//     circulatingSupply: 16987283254.763123
//   };

//   const chartData = Object.entries(data).map(([key, value]) => ({
//     name: key,
//     value: value
//   }));

//   const option = {
//     tooltip: {
//       trigger: 'item'
//     },
//     legend: {
//       top: '5%',
//       left: 'center'
//     },
//     series: [
//       {
//         name: 'Coin Distribution',
//         type: 'pie',
//         radius: ['40%', '70%'],
//         avoidLabelOverlap: false,
//         label: {
//           show: false,
//           position: 'center'
//         },
//         itemStyle: {
//           borderRadius: 10,
//           borderColor: '#fff',
//           borderWidth: 2
//         },
//         emphasis: {
//           label: {
//             show: true,
//             fontSize: '18',
//             fontWeight: 'bold'
//           }
//         },
//         labelLine: {
//           show: false
//         },
//         data: chartData
//       }
//     ]
//   };

//   return (
//     <Page>
//       <ReactECharts option={option} style={{ height: 400 }} />

//       <div className="grid-container">
//         <div className="row-container">
//           {/* First row */}
//           <KPIComponent title="KPI 1" value="Value 1" gridColumn="span 3" />
//           <KPIComponent title="KPI 2" value="Value 2" gridColumn="span 3" />
//           {/* More components for the first row */}
//         </div>
//         <div className="row-container">
//           {/* Second row */}
//           <KPIComponent title="KPI 3" value="Value 3" gridColumn="span 4" />
//           <KPIComponent title="KPI 4" value="Value 4" gridColumn="span 4" />
//           <KPIComponent title="KPI 5" value="Value 5" gridColumn="span 4" />
//           {/* More components for the second row */}
//         </div>
//         {/* Additional rows as needed */}
//       </div>
//     </Page>
//   );
// };

export default Coinstats;