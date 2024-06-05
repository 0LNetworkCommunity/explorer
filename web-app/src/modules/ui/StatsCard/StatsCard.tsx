// src/ui/StatsCard.tsx
import { FC, ReactNode } from 'react';

interface StatsCardProps {
  title: string;
  value: string | number | null;
  children?: ReactNode;
  loading?: boolean;
}

const StatsCard: FC<StatsCardProps> = ({ title, value, children, loading = false }) => {
  const isLoading = loading || value === null;

  return (
    <div className="flex flex-col bg-[#F5F5F5] p-5 gap-2">
      <span className="text-sm font-medium text-[#525252]">{title}</span>
      <span
        className={`text-xl md:text-2xl tracking-tight text-[#141414] h-8 rounded ${
          isLoading ? 'animate-pulse bg-gray-300 text-2xl space-y-4' : ''
        }`}
      >
        {isLoading ? '' : children || value}
      </span>
    </div>
  );
};

export default StatsCard;
