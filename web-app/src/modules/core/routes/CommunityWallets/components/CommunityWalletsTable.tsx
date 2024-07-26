import { FC, useState, useEffect } from 'react';
import SortableTh from '../../../../ui/Table/SortableTh';
import CommunityWalletRow from './CommunityWalletRow';
import CommunityWalletRowSkeleton from './CommunityWalletRowSkeleton';
import { ICommunityWallet } from '../../../../interface/CommunityWallets.interface';

type SortOrder = 'asc' | 'desc';

const CommunityWalletsTable: FC<{ wallets: ICommunityWallet[] }> = ({ wallets }) => {
  const [sortColumn, setSortColumn] = useState<string>('rank');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [sortedWallets, setSortedWallets] = useState<ICommunityWallet[]>([]);

  useEffect(() => {
    setSortedWallets(getSortedWallets(wallets));
  }, [wallets, sortColumn, sortOrder]);

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortOrder('asc');
    }
    setSortedWallets(getSortedWallets(wallets));
  };

  const getSortedWallets = (wallets: ICommunityWallet[]) => {
    const sortableWallets = [...wallets].sort((a, b) => {
      const [aValue, bValue] = getValue(a, b, sortColumn);

      if (aValue === bValue) {
        return a.address.localeCompare(b.address);
      }

      return aValue < bValue ? -1 : 1;
    });

    if (sortOrder === 'asc') {
      sortableWallets.reverse();
    }

    return sortableWallets;
  };

  const getValue = (a: ICommunityWallet, b: ICommunityWallet, column: string): [any, any] => {
    let value1: any;
    let value2: any;

    switch (column) {
      case 'rank':
        value1 = a.rank;
        value2 = b.rank;
        break;
      case 'address':
        value1 = a.address;
        value2 = b.address;
        break;
      case 'name':
        value1 = a.name;
        value2 = b.name;
        break;
      case 'balance':
        value1 = a.balance;
        value2 = b.balance;
        break;
      case 'description':
        value1 = a.description;
        value2 = b.description;
        break;
      default:
        value1 = a.rank;
        value2 = b.rank;
    }

    return [value1, value2];
  };

  const columns = [
    { key: 'rank', label: 'Rank', className: 'text-center' },
    { key: 'address', label: 'Address', className: '' },
    { key: 'name', label: 'Name', className: 'text-left' },
    { key: 'description', label: 'Description', className: 'text-left' },
    { key: 'balance', label: 'Balance', className: 'text-right' },
  ];

  return (
    <div className="pb-8">
      <div className="overflow-x-auto">
        <div className="inline-block min-w-full py-2 align-middle">
          <div className="overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-[#FAFAFA]">
                <tr className="text-left text-sm">
                  {columns.map((col) => (
                    <SortableTh
                      key={col.key}
                      column={col.key}
                      sortColumn={sortColumn}
                      sortOrder={sortOrder}
                      onSort={handleSort}
                      className={col.className}
                    >
                      {col.label}
                    </SortableTh>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {sortedWallets.length > 0
                  ? sortedWallets.map((wallet) => (
                      <CommunityWalletRow key={wallet.address} wallet={wallet} />
                    ))
                  : Array.from({ length: 10 }).map((_, index) => (
                      <CommunityWalletRowSkeleton key={index} />
                    ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommunityWalletsTable;
