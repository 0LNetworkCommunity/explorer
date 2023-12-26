import { FC } from "react";
import { RouterProvider } from "react-router-dom";
import { ApolloProvider } from "@apollo/client";
import {
  AptosWalletAdapterProvider,
  Wallet,
} from "@aptos-labs/wallet-adapter-react";
import { PosteroWallet } from "../postero-wallet";
import apolloClient from "./apollo";
import router from "./router";

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
        console.log("error", error);
      }}
    >
      <ApolloProvider client={apolloClient}>
        <RouterProvider router={router} />
      </ApolloProvider>
    </AptosWalletAdapterProvider>
  );
};

export default App;
