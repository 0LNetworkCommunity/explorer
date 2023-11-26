import { FC, useState } from "react";
import TreeItem from "./TreeItem";
import Tree from "./Tree";

interface Props {
  name: string;
  tree: Tree;
  parents: string[];
  onClick: (item: string) => void;
}

const Branch: FC<Props> = ({ name, tree, parents, onClick }) => {
  const [collapsed, setCollapsed] = useState(() => parents.length !== 0);

  const keys = Array.from(tree.children.keys());
  const hasChildren = keys.length > 0;

  return (
    <div>
      <TreeItem
        label={name}
        depth={parents.length}
        collapsed={hasChildren ? collapsed : undefined}
        onClick={() => {
          if (hasChildren) {
            setCollapsed(!collapsed);
          }
          onClick([...parents, name].join("::"));
        }}
      />
      {hasChildren && !collapsed && (
        <>
          {keys.map((key) => (
            <Branch
              parents={[...parents, name]}
              key={key}
              name={key}
              tree={tree.children.get(key)!}
              onClick={onClick}
            />
          ))}
        </>
      )}
    </div>
  );
};

export default Branch;
