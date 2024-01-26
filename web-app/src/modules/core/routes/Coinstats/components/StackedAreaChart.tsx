import { FC } from "react";
import ReactECharts from "echarts-for-react";
import * as echarts from "echarts";

interface Props {
  categories: string[];
  data: Record<
    string,
    {
      epoch: number;
      value: number;
    }[]
  >;
}

const colorPalette = [
  "#E8595C",
  "#188BE9",
  "#002FA7",
  "#80DED9",
  "#F0F7FE",
  "#FC8452",
  "#9A60B4",
  "#EA7CCC",
];

const transformDataForSeries = (
  data: Record<
    string,
    {
      epoch: number;
      value: number;
    }[]
  >,
  categories: string[]
) => {
  return categories.map((category, index) => {
    const baseColor = colorPalette[index % colorPalette.length];
    const lighterColor = echarts.color.lift(baseColor, 0.0);
    const darkerColor = echarts.color.lift(baseColor, -0.0);

    return {
      name: category,
      type: "line",
      stack: "Total",
      smooth: true,
      lineStyle: { width: 0 },
      showSymbol: false,
      areaStyle: {
        opacity: 0.8,
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: lighterColor },
          { offset: 1, color: darkerColor },
        ]),
      },
      data: data[category].map((item) => item.value),
    };
  });
};

const StackedAreaChart: FC<Props> = ({ data, categories }) => {
  const seriesData = transformDataForSeries(data, categories);
  const xAxisData = data[categories[0]].map((item) => `Epoch ${item.epoch}`);

  const option = {
    color: ["#80FFA5", "#00DDFF", "#37A2FF", "#FF0087", "#FFBF00"],
    title: {
      text: "Daily Transacted Volume",
      left: "center",
      textStyle: {
        fontSize: 16,
      },
    },
    tooltip: {
      trigger: "axis",
      axisPointer: {
        type: "cross",
        label: {
          backgroundColor: "#6a7985",
        },
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
      boundaryGap: false,
      data: xAxisData,
    },
    series: seriesData,
    yAxis: {
      type: "value",
    },
  };

  return <ReactECharts option={option} style={{ height: 400 }} />;
};

export default StackedAreaChart;
