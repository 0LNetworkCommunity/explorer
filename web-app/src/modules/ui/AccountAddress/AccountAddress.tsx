import { FC } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';

import { normalizeHexString } from '../../../utils';
import HexString from '../HexString';
import CopyIcon from '../Icons/CopyIcon';
import AddressAvatar from '../AddressAvatar/AddressAvatar';

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
    <div className="flex items-center">
      <AddressAvatar address={normalizedAddress} />
      <Link
        to={`/accounts/${normalizedAddress}`}
        className="text-[#CD3B42] hover:text-blue-900 hover:underline font-normal"
      >
        <HexString value={normalizedAddress} />
      </Link>
      <button
        type="button"
        onClick={handleCopy}
        className="ml-2 text-gray-400 active:scale-95 active:text-gray-200"
      >
        <CopyIcon />
      </button>
    </div>
  );
};

export default AccountAddress;
