import { FC } from 'react';
import { format } from 'date-fns';
import { Movement, TransactionType, UserTransaction } from '../../../../movements';

import GenesisMovement from './GenesisMovement';
import BlockMetadataMovement from './BlockMetadataMovement';
import UserMovement from './UserMovement';
import LibraAmount from '../../../../ui/LibraAmount';
import clsx from 'clsx';

const MovementItem: FC<{ movement: Movement }> = ({ movement }) => {
  const success =
    movement.transaction.type === TransactionType.User
      ? (movement.transaction as UserTransaction).success
      : true;

  return (
    <div className={clsx('text-slate-500 px-4 py-3 sm:px-4', !success && 'bg-red-100')}>
      <div className="flex flex-row justify-between mb-2">
        <div>
          <LibraAmount className="font-mono text-slate-800">{movement.balance}</LibraAmount>
        </div>

        <div className="font-mono text-sm">
          {`${format(movement.transaction.date, 'dd/MM/yyyy HH:mm')}`}
        </div>
      </div>

      <div className="flex flex-row">
        <div className="flex-grow">
          {(() => {
            switch (movement.transaction.type) {
              case TransactionType.Genesis:
                return <GenesisMovement movement={movement} />;
              case TransactionType.BlockMetadata:
                return <BlockMetadataMovement movement={movement} />;
              case TransactionType.User:
                return <UserMovement movement={movement} />;
            }
            return null;
          })()}
        </div>

        <div className="self-end font-mono text-gray-400 text-sm">
          {`#${movement.transaction.version}`}
        </div>
      </div>
    </div>
  );
};

export default MovementItem;
