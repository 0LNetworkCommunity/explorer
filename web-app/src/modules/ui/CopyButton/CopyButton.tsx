import { useState, FC } from 'react';
import { CheckIcon } from '@heroicons/react/24/outline';

import CopyIcon from '../Icons/CopyIcon';

interface Props {
  text: string;
}

const CopyButton: FC<Props> = ({ text }) => {
  const [isCopied, setIsCopied] = useState(false);

  const onClick = (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    event.preventDefault();
    event.stopPropagation();

    navigator.clipboard
      .writeText(text)
      .then(() => {
        setIsCopied(true);
        setTimeout(() => {
          setIsCopied(false);
        }, 2_000);
      })
      .catch((err) => {
        console.error('Failed to copy text: ', err);
      });
  };

  return (
    <button onClick={onClick} className="p-2 text-gray-400">
      {isCopied ? <CheckIcon className="h-4 w-4" /> : <CopyIcon />}
    </button>
  );
};

export default CopyButton;
