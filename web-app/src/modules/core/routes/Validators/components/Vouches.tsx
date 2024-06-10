import { FC, useState } from 'react';
import Modal from 'react-modal';
import AccountAddress from '../../../../ui/AccountAddress';

interface Vouch {
  address: string;
  epoch: number;
  index: number;
}

interface VouchesProps {
  vouches: Vouch[];
}

const Vouches: FC<VouchesProps> = ({ vouches }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  let sortedVouches = [...vouches].sort((a, b) => {
    if (a.epoch === b.epoch) {
      return a.address.localeCompare(b.address);
    }
    return a.epoch - b.epoch;
  });
  sortedVouches = sortedVouches.map((vouch, index) => ({
    ...vouch,
    index: index + 1,
  }));
  sortedVouches = sortedVouches.sort((a, b) => b.index - a.index);

  return (
    <div>
      <span className="cursor-pointer" onClick={handleOpenModal}>
        {vouches.length.toLocaleString()}
      </span>
      <Modal
        isOpen={isModalOpen}
        onRequestClose={handleCloseModal}
        contentLabel="Vouches List"
        className="max-w-lg mx-auto my-8 bg-white rounded-lg shadow-lg overflow-hidden p-4"
        overlayClassName="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center"
        style={{ width: '400px' }}
      >
        <div className="relative p-4">
          <button
            onClick={handleCloseModal}
            className="absolute top-0 right-2 w-6 h-6 mt-4 bg-transparent border-none text-2xl leading-none cursor-pointer"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
            >
              <path
                d="M18 6L6 18M6 6L18 18"
                stroke="#A3A3A3"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          <h2 className="text-xl mb-4">Active Vouches</h2>
          <div className="overflow-y-auto" style={{ maxHeight: '400px' }}>
            <table className="min-w-full divide-y divide-gray-200 text-center">
              <thead className="bg-[#FAFAFA]">
                <tr className="text-center text-sm">
                  <th className="px-2 py-2">#</th>
                  <th className="px-2 py-2">Address</th>
                  <th className="px-2 py-2">Epoch</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {sortedVouches.map((vouch) => (
                  <tr key={vouch.index} className="text-sm text-[#141414] text-center">
                    <td className="px-2 py-2">{vouch.index}</td>
                    <td className="flex justify-center px-2 py-2 text-center">
                      <AccountAddress address={vouch.address} />
                    </td>
                    <td className="px-2 py-2">{vouch.epoch}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Vouches;
