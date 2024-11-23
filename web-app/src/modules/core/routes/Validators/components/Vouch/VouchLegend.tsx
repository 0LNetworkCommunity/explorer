import React from 'react';
import clsx from 'clsx';
import { legendItems } from './legendItems';

const VouchLegend: React.FC = () => {
  return (
    <div className="mt-4 p-4 bg-[#F5F5F5] text-[#525252] rounded-md">
      <h2 className="text-lg font-bold mb-2">Vouch Legend</h2>
      <ul className="list-disc pl-5 space-y-1">
        {legendItems.map((item, index) => (
          <li key={index} className="flex items-center space-x-2">
            <item.Icon className={clsx('w-5 h-5', item.color)} />
            <span className="font-bold">{item.title}:</span>
            <span>{item.description}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default VouchLegend;
