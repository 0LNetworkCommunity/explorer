import { FC, useEffect, useState } from 'react';
import { NavLink, useParams } from 'react-router-dom';
import { Types } from 'aptos';

import useAptos from '../../../../../aptos';
import clsx from 'clsx';
import { normalizeHexString } from '../../../../../../utils';

const ModulesIndex: FC = () => {
  const { accountAddress } = useParams();
  const aptos = useAptos();
  const [modules, setModules] = useState<Types.MoveModuleBytecode[]>();

  useEffect(() => {
    const load = async () => {
      const modules = await aptos.getAccountModules(`0x${accountAddress!}`);
      modules.sort((a, b) => {
        if (a.abi!.name < b.abi!.name) {
          return -1;
        }
        if (a.abi!.name > b.abi!.name) {
          return 1;
        }
        return 0;
      });
      setModules(modules);
    };
    load();
  }, []);

  if (modules) {
    return (
      <div className="flex flex-col max-w-[19rem] w-[19rem] px-4 bg-gray-300">
        <ul>
          {modules.map((module) => (
            <li key={module.abi?.name}>
              <NavLink
                to={`/accounts/${normalizeHexString(
                  module.abi!.address,
                )}/modules/${module.abi!.name}`}
                className={({ isActive }) =>
                  clsx(
                    isActive && 'underline',
                    'text-sm font-mono',
                    'text-blue-700',
                    'hover:underline',
                  )
                }
              >
                {module.abi!.name}
              </NavLink>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  return null;
};

export default ModulesIndex;
