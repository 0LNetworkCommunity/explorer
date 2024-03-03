import { FC, PropsWithChildren } from 'react';

import Header from '../Layout/Header';

const AppFrame: FC<PropsWithChildren> = ({ children }) => {
  return (
    <div className='min-h-full flex flex-col'>
      <Header />
      {children}
    </div>
  );
};

export default AppFrame;
