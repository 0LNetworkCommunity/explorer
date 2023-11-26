import { FC } from "react";
import { Types } from "aptos";
import { CheckIcon } from "@heroicons/react/24/outline";
import TimestampCell from "./TimestampCell";
import VersionCell from "./VersionCell";

interface Props {
  transaction: Types.StateCheckpointTransaction;
}

const StateCheckpointTransactionRow: FC<Props> = ({ transaction }) => {
  return (
    <tr>
      <VersionCell version={transaction.version} />
      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
        <CheckIcon className="h-6 w-5" />
      </td>
      <TimestampCell timestamp={transaction.timestamp} />
      <td></td>
    </tr>
  );
};

export default StateCheckpointTransactionRow;
