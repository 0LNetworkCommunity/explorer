import { FC, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Types } from 'aptos';

import useAptos from '../../../../aptos';
import DetailsTable from '../../../../ui/DetailsTable';
import Code from '../../../../ui/Code/Code';
import Tree from '../../../../ui/TreeView/Tree';
import TreeView from '../../../../ui/TreeView';

type SArray = string | SArray[];

export const splitResourceName = (resourceName: string): string[] => {
  // Sorry I was too lazy to build a real parser.
  const a = resourceName
    .split(/(::|<|>)/)
    .map((it) => {
      switch (it) {
        case '<':
          return '[';
        case '>':
          return ']';
        case '::':
        case '':
          return '';
        default:
          return `"${it}",`;
      }
    })
    .filter((it) => it.length > 0)
    .join('');

  const tokens: SArray[] = eval(`[${a}]`);

  const fmt = (arr: SArray): string[] => {
    let i = 0;
    const end = arr.length;
    const r: string[] = [];
    while (i < end) {
      if (i < end - 1 && Array.isArray(arr[i + 1])) {
        const genericType = fmt(arr[i + 1]).join('::');
        r.push(`${arr[i]}<${genericType}>`);
        i += 2;
      } else {
        if (typeof arr[i] === 'string') {
          r.push(arr[i] as string);
        } else {
          const genericType = fmt(arr[i]).join('::');
          r.push(`<${genericType}>`);
        }
        i += 1;
      }
    }
    return r;
  };
  return fmt(tokens);
};

const Resources: FC = () => {
  const { accountAddress } = useParams();
  const aptos = useAptos();
  const [resources, setResources] = useState<Types.MoveResource[]>();
  const [tree, setTree] = useState<Tree>();
  const [filter, setFilter] = useState('');

  useEffect(() => {
    const load = async () => {
      const resources = await aptos.getAccountResources(`0x${accountAddress!}`);

      const tree: Tree = new Tree();
      const keys = resources.map((resource) => splitResourceName(resource.type));
      for (const key of keys) {
        tree.insert(key);
      }
      setTree(tree);

      setResources(resources);
    };
    load();
  }, []);

  if (resources) {
    const filteredResources = filter
      ? resources.filter((it) => it.type.indexOf(filter) === 0)
      : resources;

    return (
      <div className="flex flex-row max-w-full overflow-x-auto">
        <div className="flex-none w-64 mr-2">
          {tree && <TreeView tree={tree} onClick={(item) => setFilter(item)} />}
        </div>
        <div className="max-w-6xl">
          <DetailsTable>
            {filteredResources.map((resource) => (
              <div>
                <div className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900">
                  {resource.type}
                </div>
                <div className="py-3.5 pr-3 sm:pl-6 text-sm grow overflow-x-scroll">
                  <Code lang="js">{JSON.stringify(resource.data, null, 2)}</Code>
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

export default Resources;
