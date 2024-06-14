import { FC, useState } from 'react';
import { Dialog, DialogPanel, DialogTitle, Transition, TransitionChild } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';

import AccountAddress from '../../../../ui/AccountAddress';

interface Vouch {
  address: string;
  epoch: number;
}

interface VouchesProps {
  vouches: Vouch[];
}

const Vouches: FC<VouchesProps> = ({ vouches }) => {
  const [open, setOpen] = useState(!true);

  return (
    <>
      <div>
        <button type="button" onClick={() => setOpen(true)}>
          {vouches.length.toLocaleString()}
        </button>
      </div>

      <Transition show={open}>
        <Dialog className="relative z-10" onClose={setOpen}>
          <TransitionChild
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity backdrop-blur-sm" />
          </TransitionChild>

          <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
            <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
              <TransitionChild
                enter="ease-out duration-300"
                enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                enterTo="opacity-100 translate-y-0 sm:scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 translate-y-0 sm:scale-100"
                leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              >
                <DialogPanel className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
                  <div className="absolute right-0 top-0 hidden pr-4 pt-4 sm:block">
                    <button
                      type="button"
                      className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                      onClick={() => setOpen(false)}
                    >
                      <span className="sr-only">Close</span>
                      <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                    </button>
                  </div>
                  <div className="sm:flex sm:items-start">
                    <div className="mt-3 w-full sm:ml-4 sm:mt-0 sm:text-left">
                      <DialogTitle
                        as="h3"
                        className="text-base font-semibold leading-6 text-gray-900 mb-3"
                      >
                        Vouches
                      </DialogTitle>

                      <div className="overflow-y-auto min-w-full" style={{ maxHeight: '400px' }}>
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-[#FAFAFA]">
                            <tr className="text-sm">
                              <th className="px-2 py-2">#</th>
                              <th className="px-2 py-2">Epoch</th>
                              <th className="px-2 py-2">Address</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200 bg-white">
                            {vouches.map((vouch, index) => (
                              <tr key={index} className="text-sm text-[#141414] text-center">
                                <td className="px-2 py-2">{index + 1}</td>
                                <td className="px-2 py-2">{vouch.epoch}</td>
                                <td className="px-2 py-2 text-center">
                                  <AccountAddress address={vouch.address} />
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </DialogPanel>
              </TransitionChild>
            </div>
          </div>
        </Dialog>
      </Transition>
    </>
  );
};

export default Vouches;
