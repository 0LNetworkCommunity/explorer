import clsx from "clsx";
import { FC, PropsWithChildren } from "react";

const DetailsTable: FC<PropsWithChildren> = ({ children }) => {
  return (
    <div
      className={clsx(
        "shadow ring-1 ring-black ring-opacity-5 rounded-lg card p-5 mb-3 bg-white",
        "divide-y divide-gray-200 divide-y"
      )}
    >
      {children}
    </div>
  );
};

export default DetailsTable;
