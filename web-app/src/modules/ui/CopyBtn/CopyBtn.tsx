import { useState, FC } from 'react';

import CopyIcon from '../Icons/CopyIcon';
import CheckIcon from '../Icons/CheckIcon';

interface Props {
  text: string;
}

const CopyBtn: FC<Props> = ({ text }) => {
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
        }, 2000);
      })
      .catch((err) => {
        console.error('Failed to copy text: ', err);
      });
  };

  return (
    <button onClick={onClick} className="relative flex items-center p-2 rounded">
      {isCopied ? <CheckIcon /> : <CopyIcon />}
    </button>
  );
};

export default CopyBtn;
