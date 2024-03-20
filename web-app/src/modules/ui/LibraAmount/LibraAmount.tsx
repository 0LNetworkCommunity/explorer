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
    <span title={`${amount}`} {...props} ref={ref}>
      {`Ƚ ${amount.toNumber().toLocaleString()}`}
    </span>
  );
});

export default LibraAmount;
