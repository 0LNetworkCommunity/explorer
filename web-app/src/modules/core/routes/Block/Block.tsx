import { FC, useEffect, useState } from 'react';
import { Types } from 'aptos';
import { format } from 'date-fns';

import Page from '../../../ui/Page';
import useAptos from '../../../aptos';
import { Link, useParams } from 'react-router-dom';
import DetailsTable from '../../../ui/DetailsTable';
import DetailRow from '../../../ui/DetailsTable/DetailRow';
import TransactionsTable from '../../../ui/TransactionsTable';

const Block: FC = () => {
  const { blockHeight } = useParams();
  const [block, setBlock] = useState<Types.Block>();
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  const aptos = useAptos();

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      setError('');
      try {
        const block = await aptos.getBlockByHeight(parseInt(blockHeight!, 10), true);
        setBlock(block);
      } catch (err: any) {
        if (err?.error_code === 'block_pruned' || err?.message?.includes('pruned')) {
          setError(`Block ${blockHeight} has been pruned and is no longer available on this node.`);
        } else {
          setError(`Error loading block ${blockHeight}: ${err?.message || 'Unknown error'}`);
        }
        console.error('Error loading block:', err);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [blockHeight, aptos]);

  if (isLoading) {
    return (
      <Page title={`Block: ${blockHeight}`} __deprecated_grayBg>
        <div className="flex justify-center items-center h-64">
          <div className="text-gray-500">Loading block...</div>
        </div>
      </Page>
    );
  }

  if (error) {
    return (
      <Page title={`Block: ${blockHeight}`} __deprecated_grayBg>
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                Block Not Available
              </h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error}</p>
                <p className="mt-2">
                  This usually happens when the node has pruned older blocks to save storage space. 
                  Only recent blocks are available.
                </p>
              </div>
              <div className="mt-4">
                <Link
                  to="/blocks"
                  className="text-sm font-medium text-red-800 hover:text-red-600 underline"
                >
                  Go back to blocks list
                </Link>
              </div>
            </div>
          </div>
        </div>
      </Page>
    );
  }

  return (
    <Page title={`Block: ${blockHeight}`} __deprecated_grayBg>
      {block && (
        <>
          <DetailsTable>
            <DetailRow
              label="Block height"
              value={parseInt(block.block_height, 10).toLocaleString()}
            />
            <DetailRow label="Block hash" value={block.block_hash} />
            <DetailRow
              label="Block timestamp"
              value={
                <span title={block.block_timestamp}>
                  {format(
                    new Date(parseInt(block.block_timestamp, 10) / 1_000),
                    'dd/MM/yyyy hh:mm:ss',
                  )}
                </span>
              }
            />
            <DetailRow
              label="First version"
              value={
                <Link
                  to={`/transactions/${block.first_version}`}
                  className="text-blue-600 hover:text-blue-900 hover:underline"
                >
                  {parseInt(block.first_version, 10).toLocaleString()}
                </Link>
              }
            />
            <DetailRow
              label="Last version"
              value={
                <Link
                  to={`/transactions/${block.last_version}`}
                  className="text-blue-600 hover:text-blue-900 hover:underline"
                >
                  {parseInt(block.last_version, 10).toLocaleString()}
                </Link>
              }
            />
          </DetailsTable>

          <section className="mt-8">
            <h2 className="text-xl font-bold text-slate-900">Transactions</h2>

            <TransactionsTable transactions={block.transactions!} />
          </section>
        </>
      )}
    </Page>
  );
};

export default Block;
