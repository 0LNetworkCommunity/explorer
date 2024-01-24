import clsx from "clsx";
import { FC, PropsWithChildren } from "react";

type Props = PropsWithChildren<{
  className?: string;
}>;

const DetailsTable: FC<Props> = ({ className, children }) => {
  return (
    <div
      className={clsx(
        "shadow ring-1 ring-black ring-opacity-5 rounded-lg card p-5 bg-white",
        "divide-y divide-gray-200 divide-y",
        className
      )}
    >
      {children}
    </div>
  );
};

export default DetailsTable;
