import ReactECharts from 'echarts-for-react'

const colorPalette = ['#E8595C', '#188BE9', '#002FA7', '#80DED9', '#F0F7FE', '#FC8452', '#9A60B4', '#EA7CCC'];

const StackedBarChart = ({ data, title }) => {
  const option = {
    title: {
      text: title,
      left: 'center',
      top: '3%',
      textStyle: {
        fontWeight: 'bold',
        fontSize: 16
      }
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      }
    },
    legend: {
      top: '10%',
      left: 'center',
      data: ['Community Wallets', 'Slow Wallets', 'Infrastructure Escrow', 'Circulating']
    },
    grid: {
      top: '18%',
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: data.map(item => `Epoch ${item.epoch}`)
    },
    yAxis: {
      type: 'value'
    },
    color: colorPalette,
    series: [
      {
        name: 'Community Wallets',
        type: 'bar',
        stack: 'total',
        emphasis: { focus: 'series' },
        data: data.map(item => item.CommunityWallets)
      },
      {
        name: 'Slow Wallets',
        type: 'bar',
        stack: 'total',
        emphasis: { focus: 'series' },
        data: data.map(item => item.SlowWallets)
      },
      {
        name: 'Infrastructure Escrow',
        type: 'bar',
        stack: 'total',
        emphasis: { focus: 'series' },
        data: data.map(item => item.InfrastructureEscrow)
      },
      {
        name: 'Circulating',
        type: 'bar',
        stack: 'total',
        emphasis: { focus: 'series' },
        data: data.map(item => item.Circulating)
      },
    ]
  };

  return <ReactECharts option={option} style={{ height: 400 }} />;
};

export default StackedBarChart;