import { FC, useState } from 'react';
import Modal from '../Layout/Modal';
import QRCode from 'react-qr-code';
import { DocumentDuplicateIcon, QrCodeIcon } from '@heroicons/react/24/outline';

interface Props {
  address: string;
}

const AccountQRCode: FC<Props> = ({ address }) => {
  const [modalIsOpen, setModalIsOpen] = useState<boolean>(false);

  return (
    <>
      <Modal isOpen={modalIsOpen} onClose={() => setModalIsOpen(false)}>
        <div className="flex flex-col gap-4 justify-center items-center py-5">
          <button
            className="flex gap-1 justify-center items-center text-sm text-gray-500 hover:font-medium hover:text-gray-700 transition-all duration-150"
            onClick={() => navigator.clipboard.writeText(address)}
          >
            {address} <DocumentDuplicateIcon height={20} width={20} />
          </button>
          <QRCode value={address} />
        </div>
      </Modal>
      <button
        onClick={() => setModalIsOpen(true)}
        className="flex justify-center items-center bg-white rounded-lg border border-gray-300 shadow-sm p-3 hover:bg-gray-100 transition-colors duration-150"
      >
        <QrCodeIcon className="h-5 w-5" />
      </button>
    </>
  );
};

export default AccountQRCode;
