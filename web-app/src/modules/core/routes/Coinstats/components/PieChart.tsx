import { FC } from "react";
import ReactECharts from "echarts-for-react";

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
  title: string;
}

const PieChart: FC<Props> = ({ data, title }) => {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  const formattedTotal = total.toLocaleString();

  const option = {
    title: {
      text: title,
      subtext: `Total: Ƚ${formattedTotal}`,
      left: "center",
      textStyle: {
        color: "#333",
        fontWeight: "bold",
        fontSize: 16,
      },
      subtextStyle: {
        color: "#666",
        fontSize: 12,
        fontWeight: "bold",
      },
    },
    tooltip: {
      trigger: "item",
      formatter: "{b}: Ƚ{c}B ({d}%)",
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

  return <ReactECharts option={option} style={{ height: 400 }} />;
};

export default PieChart;
