import clsx from 'clsx';
import ReactECharts from 'echarts-for-react';
import { FC } from 'react';

interface Props {
  title: string;
  data: {
    name: string;
    value: number;
  }[];
}

const BarChartSupplyConcentration: FC<Props> = ({ data, title }) => {
  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: data.map(item => item.name),
      axisTick: {
        alignWithLabel: true
      },
      axisLabel: {
        rotate: 45
      }
    },
    yAxis: [
      {
        type: 'value',
        name: '# of accounts'
      }
    ],
    series: [
      {
        name: 'Liquid',
        data: data.map(item => item.value),
        type: 'bar',
        barWidth: '30%',
        itemStyle: {
          color: '#80DED9'
        }
      },
    ]
  };

  return (
    <div className="relative overflow-hidden rounded-lg bg-white px-4 pb-12 pt-5 shadow sm:px-6 sm:pt-6">
      <dt className="text-sm font-medium leading-6 text-gray-500">
        {title}
      </dt>
      <dd className={clsx("text-gray-700", "text-xs font-medium")}>
        Unique accounts on chain in each size category
      </dd>
      <dd className="w-full flex-none text-3xl font-medium leading-10 tracking-tight text-gray-900">
        <ReactECharts option={option} style={{ height: 400 }} />
      </dd>
    </div>
  );
};

export default BarChartSupplyConcentration;
