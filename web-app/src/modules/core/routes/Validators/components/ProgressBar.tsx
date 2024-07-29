import React from 'react';
import Money from '../../../../ui/Money';

interface ProgressBarProps {
  percentage: number;
  amount: number;
  precision?: number;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ percentage, amount, precision = 0 }) => {
  const [showHint, setShowHint] = React.useState(false);

  return (
    <div className="flex items-center">
      <div
        className="w-full bg-[#E5E5E5] rounded-full h-2 mr-3"
        onMouseEnter={() => setShowHint(true)}
        onMouseLeave={() => setShowHint(false)}
      >
        <div className="bg-[#CD3B42] h-2 rounded-full" style={{ width: `${percentage}%` }}></div>
        {showHint && (
          <span className="absolute px-2 py-1 text-sm bg-gray-800 text-white rounded-md">
            <Money>{amount}</Money>
          </span>
        )}
      </div>
      <span style={{ width: '35px', textAlign: 'right' }}>{percentage.toFixed(precision)}%</span>
    </div>
  );
};

export default ProgressBar;
