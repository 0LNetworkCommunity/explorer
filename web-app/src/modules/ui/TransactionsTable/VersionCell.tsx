import { FC } from "react";
import { Link } from "react-router-dom";

interface Props {
  version: number
}

const VersionCell: FC<Props> = ({ version }) => {
  return (
    <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
      <Link
        to={`/transactions/${version}`}
        className="text-blue-600 hover:text-blue-900 hover:underline"
      >
        {version.toLocaleString()}
      </Link>
    </td>
  );
};

export default VersionCell;
