import ReactECharts from 'echarts-for-react';

const BarChartLockedConcentration = ({ data, title }) => {
  const option = {
    title: {
      text: title,
      subtext: 'Unique slow wallets on chain in each size category',
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
      data: data.accountsLocked.map(item => item.name),
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
      },
      {
        type: 'value',
        name: 'Average Time to fully vest',
        position: 'right',
        axisLine: {
          show: true,
          lineStyle: {
            color: '#188BE9'
          }
        },
        axisLabel: {
          formatter: '{value} months'
        }
      }
    ],
    series: [
      {
        name: 'Locked',
        data: data.accountsLocked.map(item => item.value),
        type: 'bar',
        barWidth: '30%',
        itemStyle: {
          color: '#188BE9'
        }
      },
      {
        name: 'AVG vesting time (months)',
        data: data.avgTotalVestingTime.map(item => item.value),
        type: 'line',
        yAxisIndex: 1,
        itemStyle: {
          color: '#E8595C'
        }
      }
    ]
  };

  return <ReactECharts option={option} style={{ height: 400 }} />;
};

export default BarChartLockedConcentration;
