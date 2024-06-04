import React from 'react';
import Money from '../../../../ui/Money';

interface ProgressBarProps {
  percentage: number;
  amount: number;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ percentage, amount }) => {
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
      <span style={{ width: '35px', textAlign: 'right' }}>{Math.floor(percentage)}%</span>
    </div>
  );
};

export default ProgressBar;
