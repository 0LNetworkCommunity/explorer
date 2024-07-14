import { FC } from 'react';
import { ChevronDownIcon, ChevronRightIcon } from '@heroicons/react/20/solid';

interface Props {
  label: string;
  depth: number;
  collapsed?: boolean;
  onClick: () => void;
}

const TreeItem: FC<Props> = ({ label, depth, collapsed, onClick }) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex flex-row hover:bg-primary-400"
      style={{ cursor: 'pointer', width: '100%', textAlign: 'left' }}
    >
      <div style={{ width: `${depth * 12}px` }} />
      {collapsed !== undefined ? (
        <div className="w-6 h-6">{collapsed ? <ChevronRightIcon /> : <ChevronDownIcon />}</div>
      ) : (
        <div style={{ width: '18px' }} />
      )}
      <span className="grow">{label}</span>
    </button>
  );
};

export default TreeItem;
