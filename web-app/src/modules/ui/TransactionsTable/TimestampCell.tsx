import { FC } from "react";
import { format } from "date-fns";

interface Props {
  timestamp: number
}

const TimestampCell: FC<Props> = ({ timestamp }) => {
  const date = new Date(timestamp / 1_000);
  return (
    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
      {format(date, 'dd/MM/yyyy hh:mm:ss')}
    </td>
  );
};

export default TimestampCell;
