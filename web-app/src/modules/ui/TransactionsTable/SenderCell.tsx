import { FC } from "react";
import { Link } from "react-router-dom";

interface Props {
  sender: string;
}

const SenderCell: FC<Props> = ({ sender }) => {
  return (
    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
      <Link
        to={`/accounts/${sender}`}
        className="text-blue-600 hover:text-blue-900 hover:underline"
      >
        {sender}
      </Link>
    </td>
  );
};

export default SenderCell;
