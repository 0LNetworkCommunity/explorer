import { Types } from 'aptos';
import { FC } from 'react';
import { format } from 'date-fns';
import DetailsTable from '../../../ui/DetailsTable';
import DetailRow from '../../../ui/DetailsTable/DetailRow';
import Code from '../../../ui/Code/Code';

interface Props {
  transaction: Types.StateCheckpointTransaction;
}

const StateCheckpointTransactionDetails: FC<Props> = ({ transaction }) => {
  return (
    <DetailsTable>
      <DetailRow label="Type" value="State Checkpoint" />
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

export default StateCheckpointTransactionDetails;
