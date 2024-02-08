import { FC } from "react";
import ReactECharts from "echarts-for-react";
import ChartContainer from "./ChartContainer";

interface Props {
  title: string;
  data: any;
}

const LineAndAreaChart: FC<Props> = ({ data, title }) => {
  const option = {
    animation: false,
    tooltip: {
      trigger: "axis",
      axisPointer: {
        type: "cross",
        label: {
          backgroundColor: "#6a7985",
        },
      },
      formatter: (params: { axisValueLabel: string; data: number }[]) => {
        const epoch = params[0].axisValueLabel;
        const value = params[0].data;
        return `${epoch}<br/>${value}`;
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
      boundaryGap: true,
      data: data.map((item: { timestamp: number }) => {
        const date = new Date(item.timestamp * 1000);
        const isoString = date.toISOString();
        return isoString.slice(0, 19);
      }),
      axisTick: {
        alignWithLabel: true,
      },
      axisLine: {
        lineStyle: {
          // color: '#E8595C'
        },
      },
    },
    yAxis: {
      type: "value",
      axisLine: {
        lineStyle: {
          // color: '#E8595C'
        },
      },
      splitLine: {
        lineStyle: {
          // color: '#ced6e0'
        },
      },
    },
    series: [
      {
        data: data.map((item: { value: number }) => item.value),
        type: "line",
        smooth: true,
        symbol: "circle",
        symbolSize: 8,
        itemStyle: {
          color: "#1e90ff",
          borderColor: "#fff",
          borderWidth: 2,
        },
        lineStyle: {
          width: 3,
        },
        areaStyle: {
          // Add this for the area fill
          opacity: 0.3, // Adjust as needed for transparency
          color: "#1e90ff",
        },
      },
    ],
  };

  return (
    <ChartContainer title={title}>
      <ReactECharts option={option} style={{ height: 400 }} />
    </ChartContainer>
  );
};

export default LineAndAreaChart;
