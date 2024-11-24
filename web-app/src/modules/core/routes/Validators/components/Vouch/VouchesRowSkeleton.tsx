import React from 'react';
import clsx from 'clsx';

const VouchesRowSkeleton: React.FC = () => {
  return (
    <tr className={clsx('whitespace-nowrap text-sm text-gray-500 text-left')}>
      <td className="px-2 md:px-4 lg:px-6 py-4">
        <div className="animate-pulse bg-gray-200 h-4 w-28 mx-auto rounded"></div>
      </td>
      <td className="px-2 md:px-4 lg:px-6 py-4">
        <div className="animate-pulse bg-gray-200 h-4 w-28 mx-auto rounded"></div>
      </td>
      <td className="px-2 md:px-4 lg:px-6 py-4">
        <div className="animate-pulse bg-gray-200 h-4 w-28 mx-auto rounded"></div>
      </td>
      <td className="px-2 md:px-4 lg:px-6 py-4">
        <div className="animate-pulse bg-gray-200 h-4 w-28 mx-auto rounded"></div>
      </td>
      <td className="px-2 md:px-4 lg:px-6 py-4">
        <div className="animate-pulse bg-gray-200 h-4 w-28 mx-auto rounded"></div>
      </td>
      <td className="px-2 md:px-4 lg:px-6 py-4">
        <div className="animate-pulse bg-gray-200 h-4 w-28 mx-auto rounded"></div>
      </td>
    </tr>
  );
};

export default VouchesRowSkeleton;
