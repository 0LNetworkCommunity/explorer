import { FC } from 'react';
import clsx from 'clsx';

interface ValidatorRowProps {
  isActive: boolean;
}

const ValidatorRowSkeleton: FC<ValidatorRowProps> = () => {
  return (
    <tr className={clsx('whitespace-nowrap text-sm text-gray-500 text-center')}>
      <td className="px-2 md:px-4 lg:px-6 py-4">
        <div className="animate-pulse bg-gray-200 h-4 w-28 mx-auto rounded"></div>
      </td>
      <td className="px-2 md:px-4 lg:px-6 py-4 text-center">
        <div className="animate-pulse bg-gray-200 h-4 w-20 mx-auto rounded"></div>
      </td>
      <td className="px-2 md:px-4 lg:px-6 py-4 text-center">
        <div className="animate-pulse bg-gray-200 h-4 w-24 mx-auto rounded"></div>
      </td>
      <td className="px-2 md:px-4 lg:px-6 py-4 text-right">
        <div className="animate-pulse bg-gray-200 h-4 w-32 mx-auto rounded"></div>
      </td>
      <td className="px-2 md:px-4 lg:px-6 py-4">
        <div className="animate-pulse bg-gray-200 h-4 w-48 mx-auto rounded"></div>
      </td>
      <td className="px-2 md:px-4 lg:px-6 py-4 text-left">
        <div className="animate-pulse bg-gray-200 h-4 w-24 mx-auto rounded"></div>
      </td>
    </tr>
  );
};

export default ValidatorRowSkeleton;
