import { FC } from "react";

interface Props {
  children: number;
}

const Money: FC<Props> = ({ children }) => {
  const str = children.toLocaleString();
  return <span title={`${children}`}>{`Ƚ ${str}`}</span>;
};

export default Money;
