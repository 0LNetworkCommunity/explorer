import { ApolloClient, InMemoryCache } from "@apollo/client";

console.log('env', import.meta.env);

const client = new ApolloClient({
  uri: `${import.meta.env.VITE_API_HOST}/graphql`,
  cache: new InMemoryCache(),
});

export default client;
