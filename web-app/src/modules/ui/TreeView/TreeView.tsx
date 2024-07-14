import { FC } from 'react';
import Tree from './Tree';
import Branch from './Branch';

interface Props {
  tree?: Tree;
  onClick: (item: string) => void;
}

const TreeView: FC<Props> = ({ tree, onClick }) => {
  if (!tree) {
    return null;
  }

  const keys = Array.from(tree.children.keys());
  keys.sort();

  return (
    <div
      className="bg-primary-100"
      style={{
        fontFamily: 'mononoki',
        height: '100%',
        overflowY: 'scroll',
        color: '#1f1f1f',
      }}
    >
      {keys.map((key) => (
        <Branch parents={[]} name={key} tree={tree.children.get(key)!} onClick={onClick} />
      ))}
    </div>
  );
};

export default TreeView;
