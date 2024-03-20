import { FC } from 'react';
import { BlockMetadataTransaction, Movement } from '../../../../movements';

interface Props {
  movement: Movement;
}

const BlockMetadataMovement: FC<Props> = ({ movement }) => {
  const transaction = movement.transaction as BlockMetadataTransaction;

  return (
    <div className='text-slate-500'>{`Epoch #${transaction.epoch}`}</div>
  );
};

export default BlockMetadataMovement;
