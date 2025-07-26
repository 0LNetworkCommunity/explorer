import { FC, useEffect, useState, useRef } from 'react';
import { ChevronLeftIcon, ChevronRightIcon, MagnifyingGlassIcon } from '@heroicons/react/20/solid';
import clsx from 'clsx';
import { NavLink, useSearchParams, useNavigate } from 'react-router-dom';
import { Types } from 'aptos';

import Page from '../../../ui/Page/Page';
import useAptos from '../../../aptos';
import BlockRow from '../../../ui/BlocksTable/BlockRow';

const ITEMS_PER_PAGE = 20;

interface BlockInfo {
  block_height: string;
  block_hash: string;
  block_timestamp: string;
  first_version: string;
  last_version: string;
}

const BlocksPage: FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const page = parseInt(searchParams.get('page') ?? '1', 10);
  const [blocks, setBlocks] = useState<BlockInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [latestBlockHeight, setLatestBlockHeight] = useState<number>(0);
  const [availableBlocksCount, setAvailableBlocksCount] = useState<number>(0);
  const [searchHeight, setSearchHeight] = useState<string>('');
  const searchInput = useRef<HTMLInputElement>(null);

  const aptos = useAptos();

  const onBlockSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const input = searchHeight.trim();
    if (!input) return;

    if (/^\d+$/.test(input)) {
      navigate(`/blocks/${encodeURIComponent(input)}`);
      setSearchHeight('');
      if (searchInput.current) {
        searchInput.current.blur();
      }
    }
  };

  useEffect(() => {
    const loadBlocks = async () => {
      setIsLoading(true);
      try {
        // Get the latest block height using ledger info
        console.log('Fetching ledger info to get latest block height...');
        const ledgerInfo = await aptos.getLedgerInfo();
        const latestHeight = parseInt(ledgerInfo.block_height, 10);
        console.log('Latest block height from ledger info:', latestHeight);
        setLatestBlockHeight(latestHeight);

        const blockData: BlockInfo[] = [];

        // For the first page, start from the very latest blocks
        // For subsequent pages, calculate offset but don't go too far back due to pruning
        let startHeight: number;
        if (page === 1) {
          // Always start from the absolute latest for page 1
          startHeight = latestHeight;
        } else {
          // For other pages, calculate offset but limit how far back we go
          const offset = (page - 1) * ITEMS_PER_PAGE;
          startHeight = Math.max(latestHeight - 1000, latestHeight - offset); // Don't go back more than 1000 blocks
        }

        let blocksToFetch = ITEMS_PER_PAGE;
        let currentHeight = startHeight;
        let attemptsWithoutSuccess = 0;
        const maxAttemptsWithoutSuccess = 100; // Stop if we try 100 blocks without finding any

        console.log(`Starting to fetch blocks from height ${startHeight} for page ${page}`);

        // Fetch blocks until we have enough or run out of reasonable attempts
        while (blocksToFetch > 0 && currentHeight >= 0 && attemptsWithoutSuccess < maxAttemptsWithoutSuccess) {
          try {
            console.log(`Attempting to fetch block ${currentHeight}`);
            const block = await aptos.getBlockByHeight(currentHeight, false);
            console.log(`Successfully fetched block ${currentHeight}`);
            blockData.push({
              block_height: block.block_height,
              block_hash: block.block_hash,
              block_timestamp: block.block_timestamp,
              first_version: block.first_version,
              last_version: block.last_version,
            });
            blocksToFetch--;
            attemptsWithoutSuccess = 0; // Reset counter on success
          } catch (error: any) {
            console.log(`Error fetching block ${currentHeight}:`, error);
            attemptsWithoutSuccess++;
            // Skip pruned blocks
            if (error?.error_code === 'block_pruned' || error?.message?.includes('pruned')) {
              console.warn(`Block ${currentHeight} has been pruned, skipping...`);
            } else {
              console.warn(`Unexpected error fetching block ${currentHeight}:`, error);
            }
          }
          currentHeight--;
        }

        console.log(`Fetched ${blockData.length} blocks for page ${page}`);

        // If we didn't get any blocks, try a more aggressive fallback strategy
        if (blockData.length === 0) {
          console.log('No blocks found, trying aggressive fallback strategy...');
          // Try going back in larger increments to find any available blocks
          const fallbackRanges = [
            { start: latestHeight - 100, step: 10 },
            { start: latestHeight - 1000, step: 100 },
            { start: latestHeight - 10000, step: 1000 },
            { start: latestHeight - 100000, step: 10000 }
          ];

          for (const range of fallbackRanges) {
            if (blockData.length >= ITEMS_PER_PAGE) break;

            console.log(`Trying fallback range starting from ${range.start} with step ${range.step}`);
            for (let testHeight = range.start; testHeight >= Math.max(0, range.start - 50000); testHeight -= range.step) {
              try {
                console.log(`Testing block ${testHeight}`);
                const testBlock = await aptos.getBlockByHeight(testHeight, false);
                console.log(`Found available block at ${testHeight}, fetching nearby blocks...`);

                // Found an available block, now get blocks around this area
                for (let nearbyHeight = testHeight; nearbyHeight >= Math.max(0, testHeight - ITEMS_PER_PAGE) && blockData.length < ITEMS_PER_PAGE; nearbyHeight--) {
                  try {
                    const nearbyBlock = await aptos.getBlockByHeight(nearbyHeight, false);
                    blockData.push({
                      block_height: nearbyBlock.block_height,
                      block_hash: nearbyBlock.block_hash,
                      block_timestamp: nearbyBlock.block_timestamp,
                      first_version: nearbyBlock.first_version,
                      last_version: nearbyBlock.last_version,
                    });
                  } catch (nearbyError) {
                    // Skip this block and continue
                    continue;
                  }
                }
                break; // Exit the test loop once we find an available range
              } catch (testError) {
                // Continue testing further back
                continue;
              }
            }
            if (blockData.length > 0) break; // Exit range loop if we found blocks
          }
        }

        setBlocks(blockData);
      } catch (error) {
        console.error('Error loading blocks:', error);
        setBlocks([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadBlocks();
  }, [page, aptos]);

  if (isLoading) {
    return (
      <Page title="" __deprecated_grayBg>
        <div className="flex justify-center items-center h-64">
          <div className="text-gray-500">Loading blocks...</div>
        </div>
      </Page>
    );
  }

  // Calculate pagination - limit to showing only a reasonable number of pages
  // since we can't know exactly how many blocks are available due to pruning
  const estimatedAvailableBlocks = Math.min(latestBlockHeight + 1, 10000); // Conservative estimate
  const pageCount = Math.min(Math.ceil(estimatedAvailableBlocks / ITEMS_PER_PAGE), 100); // Cap at 100 pages
  let pages: (null | number)[] = [];

  // Show pages around current page
  const startPage = Math.max(1, page - 2);
  const endPage = Math.min(pageCount, page + 2);

  for (let i = startPage; i <= endPage; i++) {
    pages.push(i);
  }

  // Add first page if not included
  if (startPage > 1) {
    if (startPage > 2) {
      pages.unshift(null);
    }
    pages.unshift(1);
  }

  // Add last page if not included
  if (endPage < pageCount) {
    if (endPage < pageCount - 1) {
      pages.push(null);
    }
    pages.push(pageCount);
  }

  // Show error state if no blocks found
  if (!isLoading && blocks.length === 0) {
    return (
      <Page title="" __deprecated_grayBg>
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">
                No Blocks Available
              </h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p>
                  No blocks could be retrieved from the node. This may be because:
                </p>
                <ul className="list-disc list-inside mt-2">
                  <li>All recent blocks have been pruned</li>
                  <li>The node is experiencing issues</li>
                  <li>Network connectivity problems</li>
                </ul>
                <p className="mt-2">
                  Latest block height: {latestBlockHeight > 0 ? latestBlockHeight.toLocaleString() : 'Unknown'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </Page>
    );
  }

  return (
    <Page title="" __deprecated_grayBg>
      {/* Info notice about block pruning */}
      <div className="mb-4 bg-blue-50 border border-blue-200 rounded-md p-4">
        <div className="flex">
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">
              Block Availability Notice
            </h3>
            <div className="mt-2 text-sm text-blue-700">
              <p>
                This explorer shows recently available blocks. Older blocks may have been pruned
                by the node to save storage space and will not be displayed.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Block search form */}
      <div className="mb-6">
        <form className="max-w-md" onSubmit={onBlockSearch}>
          <div className="relative text-gray-400 focus-within:text-gray-600">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <MagnifyingGlassIcon className="h-5 w-5" aria-hidden="true" />
            </div>
            <input
              id="block-search"
              className={clsx(
                'ring-1',
                'block w-full rounded-md border-0 bg-white py-1.5 pl-10 pr-3',
                'text-gray-900 text-sm',
                'focus:ring-2 ring-white ring-offset-2 ring-offset-primary-600',
              )}
              placeholder="Search by block height..."
              type="search"
              name="block-search"
              ref={searchInput}
              value={searchHeight}
              onChange={(event) => setSearchHeight(event.target.value)}
            />
          </div>
        </form>
      </div>

      <div className="mt-2 flow-root overflow-x-auto">
        <div className="inline-block min-w-full py-1 align-middle px-1">
          <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
            <table className="min-w-full divide-y divide-gray-300">
              <thead className="bg-gray-50 text-left text-sm text-gray-900">
                <tr>
                  <th scope="col" className="px-3 py-2 font-normal">
                    Height
                  </th>
                  <th scope="col" className="px-3 py-2 font-normal">
                    Hash
                  </th>
                  <th scope="col" className="px-3 py-2 font-normal">
                    Transactions
                  </th>
                  <th scope="col" className="px-3 py-2 font-normal">
                    First Version
                  </th>
                  <th scope="col" className="px-3 py-2 font-normal">
                    Last Version
                  </th>
                  <th scope="col" className="px-3 py-2 font-normal text-right">
                    Age
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {blocks.map((block) => (
                  <BlockRow key={block.block_height} block={block} />
                ))}
              </tbody>
            </table>

            <div className="flex items-center justify-between border-t border-gray-200 bg-white px-2 py-2">
              <div className="flex flex-1 justify-between sm:hidden">
                <NavLink
                  to={`/blocks?page=${Math.max(1, page - 1)}`}
                  className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Previous
                </NavLink>
                <NavLink
                  to={`/blocks?page=${Math.min(pageCount, page + 1)}`}
                  className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Next
                </NavLink>
              </div>
              <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Showing{' '}
                    <span className="font-medium">
                      {((page - 1) * ITEMS_PER_PAGE + 1).toLocaleString()}
                    </span>{' '}
                    to{' '}
                    <span className="font-medium">
                      {((page - 1) * ITEMS_PER_PAGE + blocks.length).toLocaleString()}
                    </span>{' '}
                    of recent available blocks
                    {latestBlockHeight > 0 && (
                      <span className="text-gray-500">
                        {' '}(latest block: {latestBlockHeight.toLocaleString()})
                      </span>
                    )}
                  </p>
                </div>
                <div>
                  <nav
                    className="isolate inline-flex -space-x-px rounded-md shadow-sm"
                    aria-label="Pagination"
                  >
                    <NavLink
                      to={`/blocks?page=${Math.max(1, page - 1)}`}
                      className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0"
                    >
                      <span className="sr-only">Previous</span>
                      <ChevronLeftIcon className="h-5 w-5" aria-hidden="true" />
                    </NavLink>

                    {pages.map((it, index) => {
                      if (it === null) {
                        return (
                          <span
                            key={`void-${index}`}
                            className={clsx(
                              'relative inline-flex items-center',
                              'px-4 py-2',
                              'text-sm font-semibold text-gray-700',
                              'ring-1 ring-inset ring-gray-300 focus:outline-offset-0',
                            )}
                          >
                            ...
                          </span>
                        );
                      }

                      return (
                        <NavLink
                          key={it}
                          to={`/blocks?page=${it}`}
                          className={clsx(
                            'relative inline-flex items-center',
                            'px-4 py-2',
                            'text-sm font-semibold text-gray-900',
                            'ring-1 ring-inset ring-gray-300',
                            'focus:z-20 focus:outline-offset-0',

                            page === it
                              ? 'z-10 bg-primary-600 text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600'
                              : 'hover:bg-gray-50',
                          )}
                        >
                          {it.toLocaleString()}
                        </NavLink>
                      );
                    })}

                    <NavLink
                      to={`/blocks?page=${Math.min(pageCount, page + 1)}`}
                      className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0"
                    >
                      <span className="sr-only">Next</span>
                      <ChevronRightIcon className="h-5 w-5" aria-hidden="true" />
                    </NavLink>
                  </nav>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Page>
  );
};

export default BlocksPage;
