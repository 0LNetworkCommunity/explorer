import React, { FC } from 'react';

const TopLiquidAccountRowSkeleton: FC = () => {
  return (
    <tr className="whitespace-nowrap text-sm text-[#141414] text-center">
      <td className="px-2 md:px-4 lg:px-6 py-4">
        <div className="animate-pulse bg-gray-300 h-4 w-8 mx-auto"></div>
      </td>
      <td className="px-2 md:px-4 lg:px-6 py-4 text-left">
        <div className="animate-pulse bg-gray-300 h-4 w-28"></div>
      </td>
      <td className="px-2 md:px-4 lg:px-6 py-4 text-left">
        <div className="animate-pulse bg-gray-300 h-4 w-32"></div>
      </td>
      <td className="px-2 md:px-4 lg:px-6 py-4 text-right">
        <div className="animate-pulse bg-gray-300 h-4 w-28 ml-auto"></div>
      </td>
      <td className="px-2 md:px-4 lg:px-6 py-4 text-right">
        <div className="animate-pulse bg-gray-300 h-4 w-28 ml-auto"></div>
      </td>
    </tr>
  );
};

export default TopLiquidAccountRowSkeleton;
