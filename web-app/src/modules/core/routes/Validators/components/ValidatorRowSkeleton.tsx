import { FC } from 'react';
import clsx from 'clsx';
import { IValidator } from '../../../../interface/Validator.interface';

interface ValidatorRowProps {
  isActive: boolean;
}

const ValidatorRowSkeleton: FC<ValidatorRowProps> = ({ isActive }) => {
  return (
    <tr className={clsx('whitespace-nowrap text-sm text-gray-500 text-center')}>
      <td className="px-2 md:px-4 lg:px-6 py-4">
        <div className="bg-gray-200 h-4 w-24 mx-auto rounded"></div>
      </td>
      {isActive && (
        <td className="px-2 md:px-4 lg:px-6 py-4 text-center">
          <div className="bg-gray-200 h-4 w-8 mx-auto rounded"></div>
        </td>
      )}
      <td className="px-2 md:px-4 lg:px-6 py-4 text-center">
        <div className="bg-gray-200 h-4 w-12 mx-auto rounded"></div>
      </td>
      <td className="px-2 md:px-4 lg:px-6 py-4 text-right">
        <div className="bg-gray-200 h-4 w-32 mx-auto rounded"></div>
      </td>
      <td className="px-2 md:px-4 lg:px-6 py-4">
        <div className="bg-gray-200 h-4 w-48 mx-auto rounded"></div>
      </td>
      <td className="px-2 md:px-4 lg:px-6 py-4 text-left">
        <div className="bg-gray-200 h-4 w-24 mx-auto rounded"></div>
      </td>
      {/*<td className="px-2 md:px-4 lg:px-6 py-4 text-right">
        <div className="bg-gray-200 h-4 w-16 mx-auto rounded"></div>
      </td>*/}
    </tr>
  );
};

export default ValidatorRowSkeleton;
