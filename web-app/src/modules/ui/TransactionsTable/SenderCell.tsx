import { FC } from "react";
import AccountAddress from "../AccountAddress";

interface Props {
  sender: string;
}

const SenderCell: FC<Props> = ({ sender }) => {
  return (
    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
      <AccountAddress address={sender} />
    </td>
  );
};

export default SenderCell;
