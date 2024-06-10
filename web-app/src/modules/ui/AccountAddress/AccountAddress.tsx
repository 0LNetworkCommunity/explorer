import { FC } from 'react';
import { Link } from 'react-router-dom';
import { normalizeHexString } from '../../../utils';
import HexString from '../HexString';
import AddressAvatar from '../AddressAvatar/AddressAvatar';
import 'react-toastify/dist/ReactToastify.css';
import CopyBtn from '../CopyBtn/CopyBtn';

interface Props {
  address: string;
}

const AccountAddress: FC<Props> = ({ address }) => {
  const normalizedAddress = normalizeHexString(address);
  return (
    <div className="flex items-center whitespace-nowrap">
      <AddressAvatar address={normalizedAddress} />
      <Link
        to={`/accounts/${normalizedAddress}`}
        target="_blank"
        className="text-[#CD3B42] hover:text-blue-900 hover:underline font-normal"
      >
        <HexString value={normalizedAddress} />
      </Link>
      <CopyBtn text={normalizedAddress} />
    </div>
  );
};

export default AccountAddress;
