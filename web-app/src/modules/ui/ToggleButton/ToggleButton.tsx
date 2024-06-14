import { FC } from 'react';
import clsx from 'clsx';

interface ToggleOption {
  label: string;
  value: any;
}

interface ToggleButtonProps {
  options: ToggleOption[];
  activeValue: any;
  onToggle: (value: any) => void;
}

const ToggleButton: FC<ToggleButtonProps> = ({ options, activeValue, onToggle }) => {
  return (
    <div className="inline-flex border border-[#D6D6D6] rounded-md overflow-hidden shadow-sm mb-6">
      {options.map((option, index) => (
        <button
          key={index}
          onClick={() => onToggle(option.value)}
          className={clsx(
            'px-4 py-2',
            activeValue === option.value
              ? 'bg-[var(--Colors-Background-bg-active,#FAFAFA)]'
              : 'bg-white',
            index !== options.length - 1 && 'border-r border-gray-200',
          )}
        >
          <span>{option.label}</span>
        </button>
      ))}
    </div>
  );
};

export default ToggleButton;
