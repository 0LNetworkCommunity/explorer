import { FC } from 'react';
import { normalizeHexString } from '../../../utils';
import { Link } from 'react-router-dom';
import HexString from '../HexString';
import CopyIcon from '../Icons/CopyIcon';
import AddressAvatar from '../AddressAvatar/AddressAvatar';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

interface Props {
  address: string;
}

const AccountAddress: FC<Props> = ({ address }) => {
  const normalizedAddress = normalizeHexString(address);

  const handleCopy = () => {
    navigator.clipboard
      .writeText(address)
      .then(() => {
        toast.success('Address copied to clipboard');
      })
      .catch((err) => {
        console.error('Failed to copy address: ', err);
      });
  };

  return (
    <div className="flex items-center whitespace-nowrap">
      <AddressAvatar address={normalizedAddress} />
      <Link
        to={`/accounts/${normalizedAddress}`}
        className="text-[#CD3B42] hover:text-blue-900 hover:underline font-normal"
      >
        <HexString value={normalizedAddress} />
      </Link>
      <CopyIcon onClick={handleCopy} />
    </div>
  );
};

export default AccountAddress;
