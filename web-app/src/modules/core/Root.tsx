import { FC } from 'react';
import { Outlet } from 'react-router-dom';
import AppFrame from '../ui/AppFrame';
import { AptosProvider } from '../aptos';
import Footer from '../ui/Layout/Footer';

const Root: FC = () => {
  return (
    <AptosProvider>
      <AppFrame>
        <Outlet />
      </AppFrame>
      <Footer />
    </AptosProvider>
  );
};

export default Root;
