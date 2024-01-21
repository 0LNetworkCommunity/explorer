import ReactECharts from 'echarts-for-react'

const colorPalette = ['#E8595C', '#188BE9', '#002FA7', '#80DED9', '#F0F7FE', '#FC8452', '#9A60B4', '#EA7CCC'];

const PieChart = ({ data, title }) => {
  const option = {
    title: {
      text: title,
      // subtext: 'Total supply as of Jan 17th, 2024: Ƚ99.853B',
      left: 'center',
      textStyle: {
        color: '#333',
        fontWeight: 'bold',
        fontSize: 16
      },
      subtextStyle: {
        color: '#666',
        fontSize: 12, 
        fontWeight: 'bold'
      }
    },
    tooltip: {
      trigger: 'item',
      formatter: '{a} <br/>{b}: Ƚ{c}B ({d}%)'
    },
    color: colorPalette,
    series: [
      {
        name: title,
        type: 'pie',
        radius: '55%',
        center: ['50%', '50%'],
        data: data,
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)'
          }
        },
        label: {
          formatter: '{b}: {d}%'
        },
        itemStyle: {
          borderRadius: 5,
          borderColor: '#fff',
          borderWidth: 2
        }
      }
    ],
  };

  return <ReactECharts option={option} style={{ height: 400 }} />;
};

export default PieChart;