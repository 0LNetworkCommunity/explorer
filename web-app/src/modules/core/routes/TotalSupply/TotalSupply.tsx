import { FC, useEffect, useState } from "react";
import axios from "axios";
import ReactECharts from "echarts-for-react";
import clsx from "clsx";
import { config } from "../../../../config";

const TotalSupply: FC = () => {
  const [options, setOptions] = useState<any>();

  useEffect(() => {
    const load = async () => {
      const res = await axios<[number, number][]>({
        url: `${config.dataApiHost}/total-supply`,
      });

      const data = res.data.map((it) => [it[0] * 1e3, it[1]]);

      setOptions({
        animation: false,
        grid: { top: 28, right: 30, bottom: 80, left: 120 },
        xAxis: {
          type: "time",
        },
        yAxis: {
          type: "value",
          scale: true,
        },
        series: [
          {
            data,
            type: "line",
          },
        ],
        tooltip: {
          trigger: "axis",
        },
        dataZoom: [
          {
            type: "inside",
            start: 0,
            end: 10,
          },
          {
            start: 0,
            end: 10,
          },
        ],
      });
    };
    load();
  }, []);

  return (
    <>
      {options && (
        <div className="p-4">
          <div
            className={clsx(
              "h-[800px] w-full overflow-hidden rounded-md shadow",
              "bg-white",
            )}
          >
            <ReactECharts
              option={options}
              style={{ height: "100%", width: "100%" }}
            />
          </div>
        </div>
      )}
    </>
  );
};

export default TotalSupply;
