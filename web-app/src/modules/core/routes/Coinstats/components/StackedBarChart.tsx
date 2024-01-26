import ReactECharts from 'echarts-for-react'
import { FC } from 'react';

const colorPalette = ['#E8595C', '#188BE9', '#002FA7', '#80DED9', '#F0F7FE', '#FC8452', '#9A60B4', '#EA7CCC'];

interface Props {
  title: string;
  data: any;
}

const StackedBarChart: FC<Props> = ({ data, title }) => {
  const option = {
    title: {
      text: title,
      left: "center",
      top: "3%",
      textStyle: {
        fontWeight: "bold",
        fontSize: 16,
      },
    },
    tooltip: {
      trigger: "axis",
      axisPointer: {
        type: "shadow",
      },
      formatter: (
        params: { marker: string; seriesName: string; data: number }[]
      ) => {
        const total = params.reduce((sum, item) => sum + item.data, 0);
        const tooltipContent = [
          `Total Supply: ${total.toLocaleString()}`,
          ...params.map((param) => {
            return `${param.marker} ${
              param.seriesName
            }: ${param.data.toLocaleString()}`;
          }),
        ].join("<br/>");
        return tooltipContent;
      },
    },
    legend: {
      top: "10%",
      left: "center",
      data: [
        "Community Wallets",
        "Slow Wallets",
        "Infrastructure Escrow",
        "Circulating",
      ],
    },
    grid: {
      top: "18%",
      left: "3%",
      right: "4%",
      bottom: "3%",
      containLabel: true,
    },
    xAxis: {
      type: "category",
      data: data.map((item: { epoch: number }) => `Epoch ${item.epoch}`),
    },
    yAxis: {
      type: "value",
    },
    color: colorPalette,
    series: [
      {
        name: "Community Wallets",
        type: "bar",
        stack: "total",
        emphasis: { focus: "series" },
        data: data.map(
          (item: { CommunityWallets: any }) => item.CommunityWallets
        ),
      },
      {
        name: "Slow Wallets",
        type: "bar",
        stack: "total",
        emphasis: { focus: "series" },
        data: data.map((item: { SlowWallets: any }) => item.SlowWallets),
      },
      {
        name: "Infrastructure Escrow",
        type: "bar",
        stack: "total",
        emphasis: { focus: "series" },
        data: data.map(
          (item: { InfrastructureEscrow: any }) => item.InfrastructureEscrow
        ),
      },
      {
        name: "Circulating",
        type: "bar",
        stack: "total",
        emphasis: { focus: "series" },
        data: data.map((item: { Circulating: any }) => item.Circulating),
      },
    ],
  };

  return <ReactECharts option={option} style={{ height: 400 }} />;
};

export default StackedBarChart;