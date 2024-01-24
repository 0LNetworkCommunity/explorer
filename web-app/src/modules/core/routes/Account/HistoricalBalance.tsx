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
    <Chart
      className={clsx(
        "w-full rounded-md shadow overflow-hidden h-[500px]",
        "ring-1 ring-black ring-opacity-5",
        "bg-white"
      )}
      data={data}
    />
  );
};

export default HistoricalBalance;
