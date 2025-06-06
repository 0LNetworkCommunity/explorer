import { FC, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Page from '../../../ui/Page/Page';
import useAptos from '../../../aptos';
import { Types } from 'aptos';
import BlockMetadataTransactionDetails from './BlockMetadataTransactionDetails';
import UserTransactionDetails from './UserTransactionDetails';
import StateCheckpointTransactionDetails from './StateCheckpointTransactionDetails';

const Transaction: FC = () => {
  const { version } = useParams();
  const [transaction, setTransaction] = useState<Types.Transaction>();
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const aptos = useAptos();
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      if (!version) return;

      try {
        setLoading(true);
        setError(null);

        let txn: Types.Transaction;

        // Check if it's a hash (0x + 64 hex chars)
        if (version.startsWith('0x') && version.length === 66 && /^0x[0-9a-fA-F]{64}$/.test(version)) {
          try {
            txn = await aptos.getTransactionByHash(version);
            setTransaction(txn);
          } catch (txError) {
            console.error('Error loading transaction by hash:', txError);

            // If transaction not found, check if it's a valid account address (v6 onward format)
            try {
              await aptos.getAccount(version);
              // If account exists, redirect to account page
              navigate(`/accounts/${encodeURIComponent(version)}/resources`);
              return;
            } catch (acctError) {
              // Neither a valid transaction nor account
              throw txError; // Re-throw the original error
            }
          }
        }
        // Otherwise treat as version number
        else if (/^\d+$/.test(version)) {
          try {
            txn = await aptos.getTransactionByVersion(parseInt(version, 10));
            setTransaction(txn);
          } catch (txError) {
            console.error('Error loading transaction by version:', txError);
            throw txError;
          }
        }
        // Invalid format
        else {
          throw new Error('Invalid transaction identifier format');
        }
      } catch (err) {
        console.error('Error loading transaction:', err);
        setError(`Failed to load transaction: ${err instanceof Error ? err.message : 'Unknown error'}`);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [version, navigate]);

  return (
    <Page title={`Transaction: ${version}`} __deprecated_grayBg>
      {loading && <div className="text-center p-4">Loading transaction...</div>}

      {error && (
        <div className="p-4 bg-red-50 text-red-700 rounded border border-red-200">
          {error}
        </div>
      )}

      {transaction && !loading && !error && (
        <div>
          {transaction.type === 'block_metadata_transaction' && (
            <BlockMetadataTransactionDetails
              transaction={transaction as Types.BlockMetadataTransaction}
            />
          )}
          {transaction.type === 'user_transaction' && (
            <UserTransactionDetails transaction={transaction as Types.UserTransaction} />
          )}
          {transaction.type === 'state_checkpoint_transaction' && (
            <StateCheckpointTransactionDetails
              transaction={transaction as Types.StateCheckpointTransaction}
            />
          )}
          {![
            'user_transaction',
            'block_metadata_transaction',
            'state_checkpoint_transaction',
          ].includes(transaction.type) && <div>{transaction.type}</div>}
        </div>
      )}
    </Page>
  );
};

export default Transaction;
