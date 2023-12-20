import { FC, useEffect, useState } from "react";
import { Outlet, useParams } from "react-router-dom";
import { Types } from "aptos";
import clsx from "clsx";
import ViewFunction from "./ViewFunction";

import useAptos from "../../../../../aptos";
import DetailsTable from "../../../../../ui/DetailsTable";
import Code from "../../../../../ui/Code/Code";
import ExecFunction from "./ExecFunction";

const Module: FC = () => {
  const { accountAddress, moduleName } = useParams();
  const aptos = useAptos();
  const [module, setModule] = useState<Types.MoveModuleBytecode>();

  useEffect(() => {
    const load = async () => {
      const module = await aptos.getAccountModule(
        `0x${accountAddress!}`,
        moduleName!
      );
      setModule(module);
    };
    load();
  }, [accountAddress, moduleName]);

  if (module) {
    const exposed_functions = module.abi!.exposed_functions;

    exposed_functions.sort((a, b) => {
      if (a.name < b.name) {
        return -1;
      }
      if (a.name > b.name) {
        return 1;
      }
      return 0;
    });

    return (
      <div className="flex flex-col w-full px-4 py-3">
        <h1
          className={clsx("text-3xl font-bold tracking-tight text-slate-900")}
        >
          {moduleName}
        </h1>

        <ul role="list" className="space-y-3 mb-3">
          {module.abi?.exposed_functions.map((func) => {
            return func.is_view ? (
              <li
                key={func.name}
                className="overflow-hidden bg-white px-3 py-2 shadow sm:rounded-md"
              >
                <h3 className="font-semibold">{func.name}</h3>
                <ViewFunction module={module} func={func} />
              </li>
            ) : import.meta.env.VITE_FEATURE_WALLET === "true" ? (
              <li
                key={func.name}
                className="overflow-hidden bg-white px-3 py-2 shadow sm:rounded-md"
              >
                <h3 className="font-semibold">{func.name}</h3>
                <ExecFunction module={module} func={func} />
              </li>
            ) : null;
          })}
        </ul>

        <div className="max-w-6xl">
          <DetailsTable>
            <div>
              <div className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900"></div>
              <div className="py-3.5 pr-3 sm:pl-6 text-sm grow overflow-x-scroll">
                <Code lang="js">{JSON.stringify(module, null, 2)}</Code>
              </div>
            </div>
          </DetailsTable>
        </div>
        <div>
          <Outlet />
        </div>
      </div>
    );
  }

  return null;
};

export default Module;
