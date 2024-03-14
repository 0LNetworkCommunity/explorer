import { FC, useState } from 'react';
import { Link } from 'react-router-dom';
import clsx from 'clsx';
import { OrderDirection, useMovements } from '../../../../movements';
import MovementItem from './MovementItem';


const ITEM_PER_PAGE = 10;

interface Props {
  address: string;
}

const Movements: FC<Props> = ({ address }) => {
  const [cursor, setCursor] = useState<string>();
  const { movements, loading, prevCursor, nextCursor } = useMovements(
    address,
    OrderDirection.DESC,
    cursor,
    ITEM_PER_PAGE,
  );

  return (
    <div>
      <div className="overflow-hidden bg-white shadow sm:rounded-md">
        <ul role="list" className={clsx("divide-y divide-gray-200", loading && "opacity-0")}>
          {movements &&
            movements.map((movement) => (
              <li key={movement.version.toString()}>
                <Link to={`/transactions/${movement.transaction.version}`}>
                  <MovementItem movement={movement} />
                </Link>
              </li>
            ))}
        </ul>

        <nav
          className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6"
          aria-label="Pagination"
        >
          <div className="flex flex-1 justify-between sm:justify-end">
            <button
              type="button"
              disabled={cursor === undefined}
              className={clsx(
                'relative inline-flex items-center rounded-md bg-white',
                'px-3 py-2 text-sm font-semibold text-gray-900',
                'ring-1 ring-inset ring-gray-300',
                'hover:bg-gray-50 focus-visible:outline-offset-0',
                'disabled:opacity-50',
              )}
              onClick={() => {
                setCursor(prevCursor);
              }}
            >
              Previous
            </button>
            <button
              type="button"
              disabled={nextCursor === undefined}
              className={clsx(
                'relative inline-flex items-center rounded-md bg-white',
                'px-3 py-2 text-sm font-semibold text-gray-900',
                'ring-1 ring-inset ring-gray-300',
                'hover:bg-gray-50 focus-visible:outline-offset-0',
                'disabled:opacity-50',
              )}
              onClick={() => {
                if (nextCursor === undefined) {
                  return;
                }
                setCursor(nextCursor);
              }}
            >
              Next
            </button>
          </div>
        </nav>
      </div>
    </div>
  );
};

export default Movements;




