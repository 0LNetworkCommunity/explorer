import ReactECharts from 'echarts-for-react'

const LineChart = ({ data, title }) => {
  const option = {
    title: {
      text: title,
      left: 'center',
      textStyle: {
        color: '#333',
        fontWeight: 'bold',
        fontSize: 16
      }
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'cross',
        label: {
          backgroundColor: '#6a7985'
        }
      },
      formatter: params => {
        const epoch = params[0].axisValueLabel;
        const value = params[0].data;
        return `${epoch}<br/>${value}`;
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
      boundaryGap: true,
      data: data.map(item => `Epoch ${item.epoch}`),
      axisTick: {
        alignWithLabel: true
      },
      axisLine: {
        lineStyle: {
          // color: '#E8595C'
        }
      }
    },
    yAxis: {
      type: 'value',
      axisLine: {
        lineStyle: {
          // color: '#E8595C'
        }
      },
      splitLine: {
        lineStyle: {
          // color: '#ced6e0'
        }
      }
    },
    series: [
      {
        data: data.map(item => item.value),
        type: 'line',
        smooth: false,
        symbol: 'circle',
        symbolSize: 8,
        itemStyle: {
          color: '#1e90ff',
          borderColor: '#fff',
          borderWidth: 2
        },
        lineStyle: {
          width: 3
        }
      },
    ]
  };

  return <ReactECharts option={option} style={{ height: 400 }} />;
};

export default LineChart;