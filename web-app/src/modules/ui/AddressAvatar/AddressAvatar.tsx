import React, { useMemo } from 'react';
import { createIcon } from './blockies';

interface AddressAvatarProps {
  address: string;
}

const AddressAvatar: React.FC<AddressAvatarProps> = ({ address }) => {
  const icon = useMemo(() => {
    return createIcon({
      seed: address,
      size: 8,
      scale: 2,
    }).toDataURL();
  }, [address]);
  return <img src={icon} alt={address} title={address} className="rounded-full" />;
};

export default AddressAvatar;