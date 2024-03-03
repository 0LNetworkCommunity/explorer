import { FC } from 'react';
import { useMovements } from '../../../../movements';
import { Link } from 'react-router-dom';
import MovementItem from './MovementItem';

interface Props {
  address: string;
}

const Movements: FC<Props> = ({ address }) => {
  const movements = useMovements(address);

  return (
    <div className="overflow-hidden bg-white shadow sm:rounded-md">
      <ul role="list" className="divide-y divide-gray-200">
        {movements.map((movement) => (
          <li key={movement.transaction.version.toString()}>
            <Link to={`/transactions/${movement.transaction.version}`}>
              <MovementItem movement={movement} />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Movements;
