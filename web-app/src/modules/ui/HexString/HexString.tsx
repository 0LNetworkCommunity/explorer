import { FC } from 'react';
import { normalizeHexString } from '../../../utils';

const HexString: FC<{ value: string }> = ({ value }) => {
  const normalizedValue = normalizeHexString(value);
  const prefix = normalizedValue.substring(0, 4);
  const suffix = normalizedValue.substring(normalizedValue.length - 4);

  return <span className="font-mono" title={value}>{`${prefix}…${suffix}`}</span>;
};

export default HexString;
