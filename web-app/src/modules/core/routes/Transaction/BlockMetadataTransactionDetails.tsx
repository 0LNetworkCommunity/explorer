import { Types } from 'aptos';
import { FC } from 'react';
import { format } from 'date-fns';
import DetailRow from '../../../ui/DetailsTable/DetailRow';
import DetailsTable from '../../../ui/DetailsTable';
import { Link } from 'react-router-dom';
import Code from '../../../ui/Code/Code';

interface Props {
  transaction: Types.BlockMetadataTransaction;
}

const BlockMetadataTransactionDetails: FC<Props> = ({ transaction }) => {
  return (
    <DetailsTable>
      <DetailRow label="Type" value="Block Metadata" />
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
      <DetailRow label="ID" value={transaction.id} />
      <DetailRow label="Epoch" value={transaction.epoch} />
      <DetailRow label="Round" value={transaction.round} />
      <DetailRow
        label="Events"
        value={<Code lang="js">{JSON.stringify(transaction.events, null, 2)}</Code>}
      />
      <DetailRow
        label="Previous Block Botes Bitvec"
        value={
          <Code lang="js">{JSON.stringify(transaction.previous_block_votes_bitvec, null, 2)}</Code>
        }
      />

      <DetailRow
        label="Proposer"
        value={
          <Link
            to={`/accounts/${transaction.proposer}`}
            className="text-blue-600 hover:text-blue-900 hover:underline"
          >
            {transaction.proposer}
          </Link>
        }
      />
      <DetailRow
        label="Failed Proposer Indices"
        value={
          <Code lang="js">{JSON.stringify(transaction.failed_proposer_indices, null, 2)}</Code>
        }
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

export default BlockMetadataTransactionDetails;
