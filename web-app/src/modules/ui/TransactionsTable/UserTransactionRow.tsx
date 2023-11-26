import { FC } from "react";
import VersionCell from "./VersionCell";
import TimestampCell from "./TimestampCell";
import SenderCell from "./SenderCell";

interface Props {
  transaction: {
    version: number;
    timestamp: number;
    sender: string;
  };
}

const UserTransactionRow: FC<Props> = ({ transaction }) => {
  return (
    <tr>
      <VersionCell version={transaction.version} />
      <TimestampCell timestamp={transaction.timestamp} />
      <SenderCell sender={transaction.sender} />
    </tr>
  );
};

export default UserTransactionRow;
