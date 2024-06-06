import { FC } from 'react';
import { RouterProvider } from 'react-router-dom';
import 'react-toastify/dist/ReactToastify.css';
import { ToastContainer, Slide } from 'react-toastify';
import { ThemeProvider } from 'styled-components';
import { ApolloProvider } from '@apollo/client';
import { AptosWalletAdapterProvider, Wallet } from '@aptos-labs/wallet-adapter-react';

import { PosteroWallet } from '../postero-wallet';
import apolloClient from './apollo';
import router from './router';
import { GlobalStyle, theme } from './styles';

const wallets: Wallet[] = [];

if ((window as any).postero) {
  wallets.push(new PosteroWallet());
}

const App: FC = () => {
  return (
    <AptosWalletAdapterProvider
      plugins={wallets}
      autoConnect={true}
      onError={(error) => {
        console.log('error', error);
      }}
    >
      <ApolloProvider client={apolloClient}>
        <ThemeProvider theme={theme}>
          <GlobalStyle />
          <ToastContainer
            position="bottom-center"
            autoClose={3000}
            hideProgressBar
            newestOnTop
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
            transition={Slide}
            theme="dark"
          />
          <RouterProvider router={router} />
        </ThemeProvider>
      </ApolloProvider>
    </AptosWalletAdapterProvider>
  );
};

export default App;
