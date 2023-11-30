import { Types } from "aptos";
import { FC } from "react";
import VersionCell from "./VersionCell";
import { UserIcon } from "@heroicons/react/24/outline";
import TimestampCell from "./TimestampCell";
import SenderCell from "./SenderCell";

interface Props {
  transaction: Types.UserTransaction;
}

const UserTransactionRow: FC<Props> = ({ transaction }) => {
  return (
    <tr>
      <VersionCell version={transaction.version} />
      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
        <UserIcon className="h-6 w-5" />
      </td>
      <TimestampCell timestamp={transaction.timestamp} />
      <SenderCell sender={transaction.sender} />
    </tr>
  );
};

export default UserTransactionRow;
