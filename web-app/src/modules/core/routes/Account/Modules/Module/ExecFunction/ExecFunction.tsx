import { FC } from "react";
import { Types } from "aptos";
import clsx from "clsx";

interface Props {
  module: Types.MoveModuleBytecode;
  func: Types.MoveFunction;
}

const ExecFunction: FC<Props> = ({ module, func }) => {
  return (
    <form>
      {func.params.map((param, index) => {
        return (
          <div key={index} className="py-3">
            <label>
              <div className="block text-sm font-medium leading-6 text-gray-900">
                {param}
              </div>
              <input
                type="text"
                className={clsx(
                  "block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm",
                  "ring-1 ring-inset ring-gray-300 placeholder:text-gray-400",
                  "focus:ring-2 focus:ring-inset focus:ring-indigo-600"
                )}
              />
            </label>
          </div>
        );
      })}

      <button
        type="button"
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
