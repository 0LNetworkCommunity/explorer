import { FC, PropsWithChildren } from 'react';

import Header from '../Layout/Header';
// import Banner from '../Banner';

const AppFrame: FC<PropsWithChildren> = ({ children }) => {
  return (
    <div className='min-h-full flex flex-col'>
      {/* <Banner /> */}

      <Header />
      {children}
    </div>
  );
};

export default AppFrame;
