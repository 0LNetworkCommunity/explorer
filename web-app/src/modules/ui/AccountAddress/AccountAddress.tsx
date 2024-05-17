import { FC } from 'react';
import { normalizeHexString } from '../../../utils';
import { Link } from 'react-router-dom';
import HexString from '../HexString';

interface Props {
  address: string;
}

const AccountAddress: FC<Props> = ({ address }) => {
  const normalizedAddress = normalizeHexString(address);

  return (
    <Link
      to={`/accounts/${normalizedAddress}`}
      className="text-[#CD3B42] hover:text-blue-900 hover:underline font-normal"
    >
      <HexString value={normalizedAddress} />
    </Link>
  );
};

export default AccountAddress;
