import { FC } from 'react';

const CommunityWalletRowSkeleton: FC = () => {
  return (
    <tr className="text-sm text-[#141414] text-center">
      <td className="px-2 md:px-4 lg:px-6 py-4">
        <div className="animate-pulse bg-gray-300 h-4 w-8 mx-auto"></div>
      </td>
      <td className="px-2 md:px-4 lg:px-6 py-4">
        <div className="animate-pulse bg-gray-300 h-4 w-24 mx-auto"></div>
      </td>
      <td className="px-2 md:px-4 lg:px-6 py-4 text-left" style={{ minWidth: '142px' }}>
        <div className="animate-pulse bg-gray-300 h-4 w-36"></div>
        <div className="animate-pulse bg-gray-300 h-4 w-36 mt-1"></div>
      </td>
      <td className="px-2 md:px-4 lg:px-6 py-4 text-left">
        <div className="animate-pulse bg-gray-300 h-4 w-48"></div>
        <div className="animate-pulse bg-gray-300 h-4 w-48 mt-1"></div>
      </td>
      <td className="px-2 md:px-4 lg:px-6 py-4 text-right">
        <div className="animate-pulse bg-gray-300 h-4 w-28 ml-auto"></div>
      </td>
    </tr>
  );
};

export default CommunityWalletRowSkeleton;
