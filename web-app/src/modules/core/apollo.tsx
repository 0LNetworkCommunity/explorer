import { ApolloClient, InMemoryCache, split, HttpLink } from '@apollo/client';
import { getMainDefinition } from '@apollo/client/utilities';
import { GraphQLWsLink } from '@apollo/client/link/subscriptions';
import { createClient } from 'graphql-ws';
import { config } from '../../config';

const wsHost = config.apiHost.startsWith('https://')
  ? `wss://${config.apiHost.substring('https://'.length)}/graphql`
  : `ws://${config.apiHost.substring('http://'.length)}/graphql`;

const wsLink = new GraphQLWsLink(
  createClient({
    url: wsHost,
  }),
);

const httpLink = new HttpLink({
  uri: `${config.apiHost}/graphql`,
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
