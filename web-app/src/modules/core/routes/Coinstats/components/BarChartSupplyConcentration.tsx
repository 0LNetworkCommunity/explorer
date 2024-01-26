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
    title: {
      text: title,
      subtext: 'Unique accounts on chain in each size category',
      left: 'center',
      textStyle: {
        color: '#333',
        fontWeight: 'bold',
        fontSize: 16
      },
      subtextStyle: {
        color: '#555',
        fontSize: 12
      }
    },
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

  return <ReactECharts option={option} style={{ height: 400 }} />;
};

export default BarChartSupplyConcentration;
