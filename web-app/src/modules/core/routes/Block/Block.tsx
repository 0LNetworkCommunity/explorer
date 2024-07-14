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

  const aptos = useAptos();

  useEffect(() => {
    const load = async () => {
      const block = await aptos.getBlockByHeight(parseInt(blockHeight!, 10), true);
      setBlock(block);
    };
    load();
  }, []);

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
