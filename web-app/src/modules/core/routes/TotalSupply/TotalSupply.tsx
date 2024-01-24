import { FC, useEffect, useState } from "react";
import axios from "axios";

import Chart from "../../../ui/Chart";
import { Time } from "lightweight-charts";
import clsx from "clsx";

const TotalSupply: FC = () => {
  const [data, setData] = useState<{
    time: Time;
    value: number;
  }[]>();

  useEffect(() => {
    const load = async () => {
      const res = await axios({
        url: `${import.meta.env.VITE_API_HOST}/total-supply`,
      });
      setData(res.data);
    };
    load();
  }, []);

  return (
    <div className="p-4">
      <Chart
        className={clsx(
          "w-full rounded-md shadow overflow-hidden h-[800px]",
          "bg-white"
        )}
        data={data}
      />
    </div>
  );
};

export default TotalSupply;
