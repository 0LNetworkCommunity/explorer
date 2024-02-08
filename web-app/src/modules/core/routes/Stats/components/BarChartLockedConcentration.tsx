import React from 'react';
import ReactECharts from 'echarts-for-react';
import clsx from 'clsx';

interface LockedConcentrationData {
  accountsLocked: {
    name: string;
    value: number;
  }[];
  avgTotalVestingTime: {
    value: number;
  }[];
}

interface BarChartLockedConcentrationProps {
  data: LockedConcentrationData;
  title: string;
}

const BarChartLockedConcentration: React.FC<BarChartLockedConcentrationProps> = ({ data, title }) => {
  // Placeholder for chart option setup, as you've already implemented this.
  const option = {
    animation: false,
    tooltip: {
      trigger: "axis",
      axisPointer: {
        type: "shadow",
      },
    },
    grid: {
      left: "3%",
      right: "4%",
      bottom: "3%",
      containLabel: true,
    },
    xAxis: {
      type: "category",
      data: data.accountsLocked.map((item) => item.name),
      axisTick: {
        alignWithLabel: true,
      },
      axisLabel: {
        rotate: 45,
      },
    },
    yAxis: [
      {
        type: "value",
        name: "# of accounts",
      },
      {
        type: "value",
        name: "Average Time to fully vest",
        position: "right",
        axisLine: {
          show: true,
          lineStyle: {
            color: "#188BE9",
          },
        },
        axisLabel: {
          formatter: "{value} months",
        },
      },
    ],
    series: [
      {
        name: "Locked",
        data: data.accountsLocked.map((item) => item.value),
        type: "bar",
        barWidth: "30%",
        itemStyle: {
          color: "#188BE9",
        },
      },
      {
        name: "AVG vesting time (months)",
        data: data.avgTotalVestingTime.map((item) => item.value),
        type: "line",
        yAxisIndex: 1,
        itemStyle: {
          color: "#E8595C",
        },
      },
    ],
  };

  return (
    <div className="relative overflow-hidden rounded-lg bg-white px-4 pb-12 pt-5 shadow sm:px-6 sm:pt-6">
      <dt className="text-sm font-medium leading-6 text-gray-500">
        {title}
      </dt>
      <dd className={clsx("text-gray-700", "text-xs font-medium")}>
        Slow wallets on chain in each balance size category
      </dd>
      <dd className="mt-2">
        <ReactECharts option={option} style={{ height: 400 }} />
      </dd>
    </div>
  );
};

export default BarChartLockedConcentration;