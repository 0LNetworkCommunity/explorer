import { FC } from 'react';
import { Movement, UserTransaction } from '../../../../movements';
import AccountAddress from '../../../../ui/AccountAddress';
import TransferMovement from './TransferMovement';
import { normalizeHexString } from '../../../../../utils';

const ModuleAddress: FC<{ children: string }> = ({ children: input }) => {
  let label: string;

  if (input !== '01') {
    const normalizedValue = normalizeHexString(input);
    const prefix = normalizedValue.substring(0, 4);
    const suffix = normalizedValue.substring(normalizedValue.length - 4);
    label = `${prefix}…${suffix}`;
  } else {
    label = '01';
  }

  return (
    <span className="text-red-500 font-mono" title={input}>
      {label}
    </span>
  );
};

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
        <ModuleAddress>{moduleAddress}</ModuleAddress>
        {`::${transaction.moduleName}::`}
        <span className="text-blue-500">{transaction.functionName}</span>
      </div>
      {!(
        moduleAddress === '01' &&
        transaction.moduleName == 'diem_governance' &&
        transaction.functionName == 'trigger_epoch'
      ) && (
        <div>
          <AccountAddress address={`${transaction.sender.toString('hex').toUpperCase()}`} />
        </div>
      )}
    </div>
  );
};

export default UserMovement;
