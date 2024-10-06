import { FC } from 'react';
import ReactECharts from 'echarts-for-react';
import ChartContainer from './ChartContainer';

interface Props {
  title: string;
  data: { value: number; timestamp: number }[];
  showHorizontalLine?: boolean;
}

const LineChart: FC<Props> = ({ data, title, showHorizontalLine = false }) => {
  const option = {
    animation: false,
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'cross',
        label: {
          backgroundColor: '#6a7985',
        },
      },
      formatter: (params: { axisValueLabel: string; data: number }[]) => {
        const timestamp = params[0].axisValueLabel;
        const value = params[0].data;
        return `${timestamp}<br/>${value}`;
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
      boundaryGap: true,
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
        type: 'line',
        symbol: 'circle',
        symbolSize: 8,
        itemStyle: {
          color: '#1e90ff',
          borderColor: '#fff',
          borderWidth: 2,
        },
        lineStyle: {
          width: 3,
        },
        markLine: showHorizontalLine
          ? {
            data: [
              {
                yAxis: 35000,
                label: {
                  formatter: '35K',
                  fontSize: 15,
                  // fontWeight: 'bold',
                },
              },
            ],
            lineStyle: {
              type: 'dashed',
              color: 'red',
              width: 1.2,
            },
            symbol: ['none', 'diamond'],
            symbolSize: 7,
          }
          : undefined,
      },
    ],
  };

  return (
    <ChartContainer title={title}>
      <ReactECharts option={option} style={{ height: 400 }} />
    </ChartContainer>
  );
};

export default LineChart;
