import { FC, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Types } from "aptos";

import useAptos from "../../../../aptos";
import DetailsTable from "../../../../ui/DetailsTable";
import Code from "../../../../ui/Code/Code";


const Modules: FC = () => {
  const { accountAddress } = useParams();
  const aptos = useAptos();
  const [modules, setModules] = useState<Types.MoveModuleBytecode[]>();

  useEffect(() => {
    const load = async () => {
      const modules = await aptos.getAccountModules(accountAddress!);
      console.log(modules);
      setModules(modules);
    };
    load();
  }, []);

  if (modules) {

    return (
      <div className="flex flex-row max-w-full">
        <div className="max-w-6xl">
          <DetailsTable>
            {modules.map((module) => (
              <div>
                <div className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900">
                </div>
                <div className="py-3.5 pr-3 sm:pl-6 text-sm grow overflow-x-scroll">
                  <Code lang="js">
                    {JSON.stringify(module, null, 2)}
                  </Code>
                </div>
              </div>
            ))}
          </DetailsTable>
        </div>
      </div>
    );
  }

  return null;
};

export default Modules;
