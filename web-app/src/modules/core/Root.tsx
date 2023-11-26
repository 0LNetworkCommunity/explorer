import { FC } from 'react';
import { Outlet } from 'react-router-dom';
import AppFrame from '../ui/AppFrame';
import { AptosProvider } from '../aptos';

const Root: FC = () => {
  return (
    <AptosProvider>
      <AppFrame>
        <Outlet />
      </AppFrame>
    </AptosProvider>
  )
};

export default Root;
