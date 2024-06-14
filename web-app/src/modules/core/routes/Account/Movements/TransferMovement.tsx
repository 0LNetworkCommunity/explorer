import { FC, useMemo } from 'react';
import { Decimal } from 'decimal.js';
import { Movement, UserTransaction } from '../../../../movements';
import AccountAddress from '../../../../ui/AccountAddress';

interface Props {
  movement: Movement;
}

const TransferMovement: FC<Props> = ({ movement }) => {
  const transaction = movement.transaction as UserTransaction;

  const { to } = useMemo(() => {
    const params = JSON.parse(transaction.arguments);
    const to = params[0].substring(2).toUpperCase();
    const amount = new Decimal(params[1]).div(1e6);

    return { to, amount };
  }, [transaction.arguments]);

  return (
    <div className="flex flex-row items-center">
      <AccountAddress address={`${transaction.sender.toString('hex').toUpperCase()}`} />
      <span className="mx-3">{' → '}</span>
      <AccountAddress address={to} />
    </div>
  );
};

export default TransferMovement;
