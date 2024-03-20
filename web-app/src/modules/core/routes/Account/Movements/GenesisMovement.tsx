import { FC } from 'react';
import { Movement } from '../../../../movements';

interface Props {
  movement: Movement;
}

const GenesisMovement: FC<Props> = () => {
  return (
    <div className="text-slate-500">Genesis</div>
  );
};

export default GenesisMovement;
