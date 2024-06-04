import { FC } from 'react';

interface Props {
  children: number;
  decimalPlaces?: number;
}

const Money: FC<Props> = ({ children, decimalPlaces }) => {
  const str = children.toLocaleString(
    undefined,
    decimalPlaces !== undefined
      ? {
          minimumFractionDigits: decimalPlaces,
          maximumFractionDigits: decimalPlaces,
        }
      : {
          minimumFractionDigits: children < 1 ? 1 : 0,
          maximumFractionDigits: children < 1 ? 6 : 0,
        },
  );

  return <span className="whitespace-nowrap" title={`${children}`}>{`Ƚ ${str}`}</span>;
};

export default Money;
