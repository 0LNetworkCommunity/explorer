import { Types } from 'aptos';
import { FC } from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import DetailsTable from '../../../ui/DetailsTable';
import DetailRow from '../../../ui/DetailsTable/DetailRow';
import Code from '../../../ui/Code/Code';

interface Props {
  transaction: Types.UserTransaction;
}

const UserTransactionDetails: FC<Props> = ({ transaction }) => {
  return (
    <DetailsTable>
      <DetailRow label="Type" value="User Transaction" />
      <DetailRow label="Version" value={transaction.version} />
      <DetailRow label="Hash" value={transaction.hash} />
      <DetailRow label="State Change Hash" value={transaction.state_change_hash} />
      <DetailRow label="Event Root Hash" value={transaction.event_root_hash} />
      <DetailRow label="State Checkpoint Hash" value={transaction.state_checkpoint_hash} />
      <DetailRow label="Gas Used" value={transaction.gas_used} />
      <DetailRow label="Success" value={`${transaction.success}`} />
      <DetailRow label="VM Status" value={`${transaction.vm_status}`} />
      <DetailRow label="Accumulator Root Hash" value={`${transaction.accumulator_root_hash}`} />
      <DetailRow
        label="Changes"
        value={<Code lang="js">{JSON.stringify(transaction.changes, null, 2)}</Code>}
      />

      <DetailRow
        label="Sender"
        value={
          <Link
            to={`/accounts/${transaction.sender}`}
            className="text-blue-600 hover:text-blue-900 hover:underline"
          >
            {transaction.sender}
          </Link>
        }
      />

      <DetailRow label="Sequence Number" value={transaction.sequence_number} />
      <DetailRow label="Max Gas Amount" value={transaction.max_gas_amount} />
      <DetailRow label="Gas Unit Price" value={transaction.gas_unit_price} />
      <DetailRow label="Expiration Timestamp Secs" value={transaction.expiration_timestamp_secs} />
      <DetailRow
        label="Events"
        value={<Code lang="js">{JSON.stringify(transaction.events, null, 2)}</Code>}
      />
      <DetailRow
        label="Payload"
        value={<Code lang="js">{JSON.stringify(transaction.payload, null, 2)}</Code>}
      />

      <DetailRow
        label="Timestamp"
        value={
          <span title={transaction.timestamp}>
            {`${format(
              new Date(parseInt(transaction.timestamp, 10) / 1_000),
              'dd/MM/yyyy hh:mm:ss',
            )}`}
          </span>
        }
      />
    </DetailsTable>
  );
};

export default UserTransactionDetails;
