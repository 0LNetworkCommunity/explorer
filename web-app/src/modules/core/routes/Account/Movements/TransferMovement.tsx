import { FC, useMemo } from 'react';
import { Decimal } from 'decimal.js';
import { Movement, UserTransaction } from '../../../../movements';
import AccountAddress from '../../../../ui/AccountAddress';
import LibraAmount from '../../../../ui/LibraAmount';

interface Props {
  movement: Movement;
}

const TransferMovement: FC<Props> = ({ movement }) => {
  const transaction = movement.transaction as UserTransaction;

  const { to, amount } = useMemo(() => {
    const params = JSON.parse(transaction.arguments);
    const to = params[0].substring(2).toUpperCase();
    const amount = new Decimal(params[1]).div(1e6);

    return { to, amount };
  }, [transaction.arguments]);

  return (
    <div>
      <LibraAmount className="font-mono">{amount}</LibraAmount>{' - '}
      <AccountAddress address={`${transaction.sender.toString('hex').toUpperCase()}`} />
      {' → '}
      <AccountAddress address={to} />
    </div>
  );
};

export default TransferMovement;
