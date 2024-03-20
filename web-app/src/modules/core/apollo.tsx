import { ApolloClient, InMemoryCache, split, HttpLink } from '@apollo/client';
import { getMainDefinition } from '@apollo/client/utilities';
import { GraphQLWsLink } from '@apollo/client/link/subscriptions';
import { createClient } from 'graphql-ws';

const API_HOST: string = import.meta.env.VITE_API_HOST;
const wsHost = API_HOST.startsWith('https://')
  ? `wss://${API_HOST.substring('https://'.length)}/graphql`
  : `ws://${API_HOST.substring('http://'.length)}/graphql`;

const wsLink = new GraphQLWsLink(
  createClient({
    url: wsHost,
  }),
);

const httpLink = new HttpLink({
  uri: `${import.meta.env.VITE_API_HOST}/graphql`,
});

const splitLink = split(
  ({ query }) => {
    const definition = getMainDefinition(query);
    return definition.kind === 'OperationDefinition' && definition.operation === 'subscription';
  },
  wsLink,
  httpLink,
);

const client = new ApolloClient({
  link: splitLink,
  cache: new InMemoryCache(),
});

export default client;
