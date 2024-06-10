import { useState } from 'react';
import CopyIcon from '../Icons/CopyIcon';
import CheckIcon from '../Icons/CheckIcon';
import PropTypes from 'prop-types';

interface Props {
  text: string;
}

const CopyBtn = ({ text }: Props) => {
  const [isCopied, setIsCopied] = useState(false);

  const handleClick = (event: { preventDefault: () => void; stopPropagation: () => void }) => {
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
    <button onClick={handleClick} className="relative flex items-center p-2 rounded">
      {isCopied ? <CheckIcon /> : <CopyIcon />}
    </button>
  );
};

CopyBtn.propTypes = {
  text: PropTypes.string.isRequired,
};

export default CopyBtn;
