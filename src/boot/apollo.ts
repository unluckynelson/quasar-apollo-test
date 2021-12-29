import { ApolloClient } from '@apollo/client/core';
import { ApolloClients } from '@vue/apollo-composable';
import { getClientOptions, storeClientHidratation } from '@viatu/plugins/apollo';
import type { ApolloClients as SSRApolloClients } from '@vue/apollo-ssr';

import { boot } from 'quasar/wrappers';

export default boot(({ app, ssrContext }) => {
  // Default client.
  const options = getClientOptions(ssrContext);
  const apolloClient = new ApolloClient(options);

  // Add more clients here if necessary
  const apolloClients = {
    default: apolloClient,
  } as SSRApolloClients;

  app.provide(ApolloClients, apolloClients);
  storeClientHidratation(ssrContext, apolloClients);
});
