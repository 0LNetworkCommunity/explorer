import { FC } from 'react';
import clsx from 'clsx';

interface ToggleButtonProps {
  isActive: boolean;
  setIsActive: (isActive: boolean) => void;
}

const ToggleButton: FC<ToggleButtonProps> = ({ isActive, setIsActive }) => {
  return (
    <div className="inline-flex border border-gray-200 rounded-md overflow-hidden shadow-sm mb-6">
      <button
        onClick={() => setIsActive(true)}
        className={clsx(
          'px-4 py-2',
          isActive ? 'bg-[var(--Colors-Background-bg-active,#FAFAFA)]' : 'bg-white',
          'border-r border-gray-200',
        )}
      >
        <span>Active</span>
      </button>
      <button
        onClick={() => setIsActive(false)}
        className={clsx(
          'px-4 py-2',
          !isActive ? 'bg-[var(--Colors-Background-bg-active,#FAFAFA)]' : 'bg-white',
        )}
      >
        Inactive
      </button>
    </div>
  );
};

export default ToggleButton;
