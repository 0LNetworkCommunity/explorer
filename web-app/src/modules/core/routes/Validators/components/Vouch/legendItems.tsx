// legendItems.tsx
import {
  GlobeAltIcon,
  CheckIcon,
  XMarkIcon,
  ExclamationTriangleIcon,
  ClockIcon,
} from '@heroicons/react/20/solid';

export interface LegendItem {
  Icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  color: string;
  title: string;
  description: string;
}

export const legendItems: LegendItem[] = [
  {
    Icon: GlobeAltIcon,
    color: 'text-blue-500', // Color for "In Set"
    title: 'In Set',
    description: 'The validator is part of the current active set.',
  },
  {
    Icon: CheckIcon,
    color: 'text-green-500', // Color for "Compliant"
    title: 'Compliant',
    description: 'The validator is compliant with audit qualifications.',
  },
  {
    Icon: XMarkIcon,
    color: 'text-red-500', // Color for "Non-Compliant"
    title: 'Non-Compliant',
    description: 'The validator is not compliant with audit qualifications.',
  },
  {
    Icon: ExclamationTriangleIcon,
    color: 'text-yellow-500', // Color for "Expiring Soon"
    title: 'Expiring Soon',
    description: 'Vouch will expire in less than 7 epochs.',
  },
  {
    Icon: ClockIcon,
    color: 'text-red-500', // Color for "Expired"
    title: 'Expired',
    description: 'The vouch has expired.',
  },
  {
    Icon: () => (
      <span
        className="inline-block w-3 h-3 rounded-full"
        style={{ backgroundColor: 'purple', margin: '0px 4px' }} // Color for "Family"
      ></span>
    ),
    color: '', // No icon, so no color
    title: 'Family Color',
    description: 'Represents the vouch family grouping.',
  },
];
