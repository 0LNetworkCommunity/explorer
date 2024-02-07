import { FC } from "react";
import ReactECharts from "echarts-for-react";
import Money from "../../../../ui/Money";
import ChartContainer from "./ChartContainer";

const colorPalette = [
  "#E8595C",
  "#188BE9",
  "#002FA7",
  "#80DED9",
  "#FC8452",
  "#9A60B4",
  "#EA7CCC",
];

// Create a mapping from names to colors
const colorMapping = {
  "Community Wallets": "#E8595C",
  Locked: "#188BE9",
  "Infrastructure escrow": "#002FA7",
  Circulating: "#80DED9",
};

interface Props {
  data: { name: keyof typeof colorMapping; value: number }[];
  title?: string;
}

const PieChart: FC<Props> = ({ data, title }) => {
  const total = data.reduce((sum, item) => sum + item.value, 0);

  const option = {
    animation: false,
    tooltip: {
      trigger: "item",
      formatter: (params) => {
        const value = params.value.toLocaleString('en-US');
        return `${params.name}: Ƚ${value} (${params.percent}%)`;
      },
    },
    color: colorPalette,
    series: [
      {
        name: title,
        type: "pie",
        radius: "55%",
        center: ["50%", "50%"],
        data: data.map((item, index) => {
          return {
            ...item,
            itemStyle: {
              color:
                colorMapping[item.name] ??
                colorPalette[index % colorPalette.length],
            },
          };
        }),
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: "rgba(0, 0, 0, 0.5)",
          },
        },
        label: {
          formatter: "{b}: {d}%",
        },
        itemStyle: {
          borderRadius: 5,
          borderColor: "#fff",
          borderWidth: 2,
        },
      },
    ],
  };

  return (
    <ChartContainer title={title} subtitle={<Money>{total}</Money>}>
      <ReactECharts
        option={option}
        style={{ height: 300 }}
      />
    </ChartContainer>
  );
};

export default PieChart;
