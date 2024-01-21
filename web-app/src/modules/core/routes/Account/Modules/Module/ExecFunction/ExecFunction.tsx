import { FC, useState } from "react";
import { Types, BCS } from "aptos";
import clsx from "clsx";
import { useWallet } from "@aptos-labs/wallet-adapter-react";

interface Props {
  module: Types.MoveModuleBytecode;
  func: Types.MoveFunction;
}

const ExecFunction: FC<Props> = ({ module: mod, func }) => {
  const aptosWallet = useWallet();

  const [args, setArgs] = useState<string[]>([]);
  const [genericParams, setGenericParams] = useState<string[]>([]);

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!aptosWallet) {
      return;
    }
    await aptosWallet.signAndSubmitTransaction({
      data: {
        function: `${mod.abi!.address}::${mod.abi!.name}::${func.name}`,
        typeArguments: [],
        functionArguments: args.map((arg) => BCS.bcsSerializeStr(arg)),
      },
    });
  };

  const params = func.params.filter((param) => !["signer"].includes(param));

  return (
    <form onSubmit={onSubmit}>
      {func.generic_type_params.length > 0 && (
        <div className="py-2">
          <h3 className="text-sm text-slate-600">Generic params</h3>

          <div className="p-2">
            {func.generic_type_params.map((_, index) => (
              <div key={index} className="py-3">
                <label>
                  <div className="block text-sm text-gray-900">
                    {`Generic param #${index + 1}`}
                  </div>
                  <input
                    type="text"
                    className={clsx(
                      "px-2",
                      "block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm",
                      "ring-1 ring-inset ring-gray-300 placeholder:text-gray-400",
                      "focus:ring-2 focus:ring-inset focus:ring-indigo-600"
                    )}
                    value={genericParams[index]}
                    onChange={(event) => {
                      setGenericParams((prev) => {
                        const newGenericParams = [...prev];
                        newGenericParams[index] = event.target.value;
                        return newGenericParams;
                      });
                    }}
                  />
                </label>
              </div>
            ))}
          </div>
        </div>
      )}

      {params.length > 0 && (
        <div className="py-2">
          <h3 className="text-sm text-slate-600">Params</h3>

          <div className="p-2">
            {params.map((param, index) => {
              return (
                <div key={index} className="py-3">
                  <label>
                    <div className="block text-sm font-medium leading-6 text-gray-900">
                      {param}
                    </div>
                    <input
                      type="text"
                      className={clsx(
                        "px-2",
                        "block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm",
                        "ring-1 ring-inset ring-gray-300 placeholder:text-gray-400",
                        "focus:ring-2 focus:ring-inset focus:ring-indigo-600"
                      )}
                      value={args[index]}
                      onChange={(event) => {
                        setArgs((prev) => {
                          const newArgs = [...prev];
                          newArgs[index] = event.target.value;
                          return newArgs;
                        });
                      }}
                    />
                  </label>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <button
        type="submit"
        className={clsx(
          "rounded bg-primary-600",
          "px-2 py-1",
          "text-sm font-semibold text-white",
          "shadow-sm",
          "hover:bg-primary-500",
          "focus-visible:outline focus-visible:outline-2",
          "focus-visible:outline-offset-2 focus-visible:outline-primary-600"
        )}
      >
        Exec
      </button>
    </form>
  );
};

export default ExecFunction;
