import { FC } from "react";
import { RouterProvider } from "react-router-dom";
import { ApolloProvider } from '@apollo/client';
import apolloClient from "./apollo";
import router from "./router";

const App: FC = () => {
  return (
    <ApolloProvider client={apolloClient}>
      <RouterProvider router={router} />
    </ApolloProvider>
  );
};

export default App;
