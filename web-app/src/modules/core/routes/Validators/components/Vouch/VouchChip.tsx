// VouchChip.tsx
import React from 'react';
import clsx from 'clsx';
import { legendItems } from './legendItems';
import { formatAddress } from '../../../../../../utils';
import { FamilyIcon } from './FamilyIcon';

interface VouchDetails {
  inSet: boolean;
  compliant: boolean;
  epochsToExpire: number;
  handle?: string;
  address: string;
  family: string;
}

export const VouchChip: React.FC<{ vouch: VouchDetails; index: number }> = ({ vouch, index }) => {
  // Determine which icons to display based on vouch properties
  const activeIcons = legendItems.filter((item) => {
    switch (item.title) {
      case 'In Set':
        return vouch.inSet;
      case 'Compliant':
        return vouch.compliant;
      case 'Non-Compliant':
        return !vouch.compliant;
      case 'Expiring Soon':
        return vouch.epochsToExpire <= 7 && vouch.epochsToExpire > 0;
      case 'Expired':
        return vouch.epochsToExpire <= 0;
      default:
        return false;
    }
  });

  return (
    <span
      key={index}
      className={clsx(
        'inline-flex items-center px-2 py-1 rounded-full text-sm font-medium text-black',
      )}
      style={{
        backgroundColor: '#F0F0F0',
        marginRight: '8px',
        marginBottom: '8px',
      }}
    >
      {activeIcons.map((item, idx) => (
        <span key={idx} className="relative group mr-1">
          <item.Icon className={clsx('w-4 h-4', item.color)} />
          <span className="absolute bottom-full mb-1 hidden group-hover:block bg-black text-white text-xs rounded py-1 px-2 whitespace-nowrap">
            {item.title}
          </span>
        </span>
      ))}

      {/* Display Family Icon */}
      {vouch.family && (
        <span className="relative group mr-1">
          <FamilyIcon family={vouch.family} />
          <span className="absolute bottom-full mb-1 hidden group-hover:block bg-black text-white text-xs rounded py-1 px-2 whitespace-nowrap">
            Family Color
          </span>
        </span>
      )}

      {/* Display Handle or Address */}
      {vouch.handle || formatAddress(vouch.address)}
      <span className="ml-1" style={{ fontSize: 8 }}>
        ({vouch.epochsToExpire})
      </span>
    </span>
  );
};

export default VouchChip;
