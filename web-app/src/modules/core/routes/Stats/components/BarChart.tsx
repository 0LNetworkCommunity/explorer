import { FC } from 'react';
import ReactECharts from 'echarts-for-react';

interface Props {
  data: {
    timestamp: number;
    value: number;
  }[];
  title: string;
}

const BarChart: FC<Props> = ({ data, title }) => {
  const option = {
    animation: false,
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow',
      },
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      data: data.map((item: { timestamp: number }) => {
        const date = new Date(item.timestamp * 1000);
        const isoString = date.toISOString();
        return isoString.slice(0, 19);
      }),
      axisTick: {
        alignWithLabel: true,
      },
    },
    yAxis: {
      type: 'value',
    },
    series: [
      {
        data: data.map((item) => item.value),
        type: 'bar',
        barWidth: '60%', // Adjust the bar width as needed
        itemStyle: {
          color: '#E8595C', // Bar color
        },
      },
    ],
  };

  return (
    <div className="relative overflow-hidden rounded-lg bg-white px-4 pb-12 pt-5 shadow sm:px-6 sm:pt-6">
      <dt className="text-sm font-medium leading-6 text-gray-500">{title}</dt>
      <dd className="w-full flex-none text-3xl font-medium leading-10 tracking-tight text-gray-900">
        <ReactECharts option={option} style={{ height: 400 }} />
      </dd>
    </div>
  );
};

export default BarChart;
