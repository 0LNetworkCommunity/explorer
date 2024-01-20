import { FC, useEffect, useState } from "react";
import clsx from "clsx";
import axios from "axios";
import { Time } from "lightweight-charts";

import Chart from "../../../ui/Chart";

interface Props {
  address: string;
}

const HistoricalBalance: FC<Props> = ({ address }) => {
  const [data, setData] = useState<
    {
      time: Time;
      value: number;
    }[]
  >();

  useEffect(() => {
    const load = async () => {
      const res = await axios({
        url: `${import.meta.env.VITE_API_HOST}/historical-balance/${address}`,
      });
      setData(res.data);
    };
    load();
  }, [address]);

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

export default HistoricalBalance;
