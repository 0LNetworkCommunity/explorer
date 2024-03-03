import { FC } from 'react';
import { Movement, UserTransaction } from '../../../../movements';
import AccountAddress from '../../../../ui/AccountAddress';
import TransferMovement from './TransferMovement';

interface Props {
  movement: Movement;
}

const UserMovement: FC<Props> = ({ movement }) => {
  const transaction = movement.transaction as UserTransaction;

  const moduleAddress = transaction.moduleAddress.toString('hex').toUpperCase();

  if (
    moduleAddress === '01' &&
    transaction.moduleName === 'ol_account' &&
    transaction.functionName === 'transfer'
  ) {
    return <TransferMovement movement={movement} />;
  }

  return (
    <div>
      <div className="font-mono">
        <span className="text-red-500">{moduleAddress}</span>
        {`::${transaction.moduleName}::`}
        <span className="text-blue-500">{transaction.functionName}</span>
      </div>
      <div>
        <AccountAddress address={`${transaction.sender.toString('hex').toUpperCase()}`} />
      </div>
    </div>
  );
};

export default UserMovement;
