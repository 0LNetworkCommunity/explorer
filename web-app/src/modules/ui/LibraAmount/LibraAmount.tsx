import React, { forwardRef } from 'react';
import Decimal from 'decimal.js';

type Props = Omit<React.HTMLAttributes<HTMLSpanElement>, 'children'> & {
  children: Decimal;
};

const LibraAmount = forwardRef<HTMLSpanElement, Props>(function LibraAmount(
  { children: amount, ...props },
  ref,
) {
  return (
    <span
      title={`${amount.toNumber().toLocaleString(undefined, {
        minimumFractionDigits: 6,
      })}`}
      {...props}
      ref={ref}
    >
      {`Ƚ ${amount.toNumber().toLocaleString(undefined, {
        maximumFractionDigits: 6,
      })}`}
    </span>
  );
});

export default LibraAmount;
