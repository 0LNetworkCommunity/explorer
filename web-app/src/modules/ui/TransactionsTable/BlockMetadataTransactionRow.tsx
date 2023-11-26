import { FC } from "react";
import { Types } from "aptos";
import { CubeIcon } from "@heroicons/react/24/outline";
import TimestampCell from "./TimestampCell";
import SenderCell from "./SenderCell";
import VersionCell from "./VersionCell";

interface Props {
  transaction: Types.BlockMetadataTransaction
}

const BlockMetadataTransactionRow: FC<Props> = ({ transaction }) => {
  return (
    <tr>
      <VersionCell version={transaction.version} />
      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
        <CubeIcon className="h-6 w-5" />
      </td>
      <TimestampCell timestamp={transaction.timestamp} />
      <SenderCell sender={transaction.proposer} />
    </tr>
  );
};

export default BlockMetadataTransactionRow;
