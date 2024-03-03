import { FC } from "react";
import { gql, useQuery } from "@apollo/client";
import _ from "lodash";
import Page from "../../../ui/Page";
import AccountAddress from "../../../ui/AccountAddress";
import clsx from "clsx";
import { LIBRA_SIGN } from "../../../../contants";
import { CheckIcon, XMarkIcon } from "@heroicons/react/20/solid";

const GET_VALIDATORS = gql`
  query GetValidators {
    validators {
      inSet
      address
      votingPower
      account {
        balance
        slowWallet {
          unlocked
        }
      }
      vouches {
        epoch
      }
      currentBid {
        currentBid
        expirationEpoch
      }
      grade {
        compliant
        failedBlocks
        proposedBlocks
      }
    }
  }
`;

const Validators: FC = () => {
  const { loading, data, error } = useQuery<{
    validators: {
      address: string;
      inSet: boolean;
      votingPower: number;
      account: {
        balance: number;
        slowWallet: {
          unlocked: number;
        } | null;
      };
      vouches: {
        epoch: number;
      }[];
      grade: {
        compliant: boolean;
        failedBlocks: number;
        proposedBlocks: number;
      };
      currentBid: {
        currentBid: number;
        expirationEpoch: number;
      };
    }[];
  }>(GET_VALIDATORS);

  if (!data && loading) {
    return (
      <Page __deprecated_grayBg>
        <div>Loading...</div>
      </Page>
    );
  }

  if (data) {
    const validatorSet = data.validators.filter((it) => it.inSet)
    const eligible = data.validators.length - validatorSet.length;

    return (
      <Page __deprecated_grayBg>
        <section className="mt-2 flow-root">
          <div>
            <dl className="grid gap-0.5 overflow-hidden rounded-2xl text-center grid-cols-3">
              <div className="flex flex-col bg-gray-400/5 p-4">
                <dt className="text-sm font-semibold leading-6 text-gray-600">
                  Validator Set
                </dt>
                <dd className="order-first text-3xl tracking-tight text-gray-900 font-mono">
                  {validatorSet.length}
                </dd>
              </div>
              <div className="flex flex-col bg-gray-400/5 p-4">
                <dt className="text-sm font-semibold leading-6 text-gray-600">
                  Eligible
                </dt>
                <dd className="order-first text-3xl tracking-tight text-gray-900 font-mono">
                  {eligible}
                </dd>
              </div>
            </dl>
          </div>

          <div className="overflow-x-auto">
            <div className="inline-block min-w-full py-2 align-middle px-2">
              <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
                <table className="min-w-full divide-y divide-gray-300">
                  <thead className="bg-gray-50">
                    <tr
                      className={clsx(
                        "divide-x divide-gray-200",
                        "text-left text-sm font-semibold text-gray-900"
                      )}
                    >
                      <th scope="col" className="py-3 px-2">
                        Address
                      </th>
                      <th scope="col" className="py-3 px-2">
                        In Set
                      </th>
                      <th scope="col" className="py-3 px-2">
                        Voting Power
                      </th>
                      <th scope="col" className="py-3 px-2">
                        Grade
                      </th>
                      <th scope="col" className="py-3 px-2">
                        Active Vouches
                      </th>
                      <th scope="col" className="py-3 px-2 text-right">
                        Current Bid (Expiration Epoch)
                      </th>
                      <th scope="col" className="py-3 px-2 text-right">
                        Balance
                      </th>
                      <th scope="col" className="py-3 px-2 text-right">
                        Unlocked
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {data.validators.map((validator) => (
                      <tr
                        key={validator.address}
                        className={clsx(
                          "divide-x divide-gray-200",
                          "whitespace-nowrap text-sm text-gray-500 even:bg-gray-50"
                        )}
                      >
                        <td className="px-2 py-2 pl-3">
                          <AccountAddress address={validator.address} />
                        </td>
                        <td className="px-2 py-2 text-center">
                          {validator.inSet ? (
                            <CheckIcon className="w-5 h-5 text-green-500 inline" />
                          ) : (
                            <XMarkIcon className="w-5 h-5 text-red-500 inline" />
                          )}
                        </td>
                        <td className="px-2 py-2">
                          {validator.votingPower.toLocaleString()}
                        </td>
                        <td className="px-2 py-2">
                          {validator.grade.compliant ? (
                            <CheckIcon className="w-5 h-5 text-green-500 inline" />
                          ) : (
                            <XMarkIcon className="w-5 h-5 text-red-500 inline" />
                          )}
                          {`${validator.grade.proposedBlocks.toLocaleString()} / ${validator.grade.failedBlocks.toLocaleString()}`}
                        </td>
                        <td className="px-2 py-2">
                          {validator.vouches.length.toLocaleString()}
                        </td>
                        <td className="px-2 py-2 font-mono text-right">
                          {`${validator.currentBid.currentBid.toLocaleString()} (${validator.currentBid.expirationEpoch.toLocaleString()})`}
                        </td>
                        <td className="px-2 py-2 font-mono text-right">
                          {`${LIBRA_SIGN} ${validator.account.balance.toLocaleString()}`}
                        </td>
                        <td className="px-2 py-2 font-mono text-right">
                          {validator.account.slowWallet &&
                            `${LIBRA_SIGN} ${validator.account.slowWallet.unlocked.toLocaleString()}`}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </section>
      </Page>
    );
  }
  
  console.log('error', error);

  if (error) {
    return (
      <Page __deprecated_grayBg>
        <p>{`Error: ${error.message}`}</p>
      </Page>
    );
  }


  return null
};

export default Validators;
