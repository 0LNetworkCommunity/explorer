import { FC } from "react";
import Page from "../../../ui/Page";
import { useValidatorSet } from "../../../ol";
import { Link } from "react-router-dom";

const Validators: FC = () => {
  const validatorSet = useValidatorSet();

  return (
    <Page title="Validators">
      {validatorSet && (
        <section className="mt-8">
          <h2 className="text-xl font-bold text-slate-900">
            Active validators
          </h2>

          <div className="mt-2 flow-root">
            <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
              <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
                <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
                  <table className="min-w-full divide-y divide-gray-300">
                    <thead className="bg-gray-50">
                      <tr>
                        <th
                          scope="col"
                          className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6"
                        >
                          Address
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white">
                      {validatorSet.active_validators.map((validator) => (
                        <tr>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                            <Link
                              to={`/accounts/${validator.addr}`}
                              className="text-blue-600 hover:text-blue-900 hover:underline"
                            >
                              {validator.addr}
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}
    </Page>
  );
};

export default Validators;
