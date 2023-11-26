import { FC, ReactNode } from "react";

interface Props {
  label: string;
  value: ReactNode | undefined;
}
const DetailRow: FC<Props> = ({ label: key, value }) => {
  return (
    <div className="flex flex-row">
      <div className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6 w-3/12 overflow-x-scroll">
        {key}
      </div>
      <div className="py-3.5 pr-3 sm:pl-6 text-sm grow overflow-x-scroll">{value}</div>
    </div>
  );
};

export default DetailRow;
