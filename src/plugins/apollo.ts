import { createHttpLink, InMemoryCache } from '@apollo/client/core';
import type { ApolloClient, NormalizedCacheObject, ApolloClientOptions } from '@apollo/client/core';
import { QSsrContext } from '@quasar/app';
import { exportStates, ApolloClients } from '@vue/apollo-ssr';

import fetch from 'cross-fetch';
import { getCurrentInstance, useSSRContext } from 'vue';

let apolloClientsCache: ApolloClients = {};

export function getClientOptions(ssrContext: QSsrContext | null | undefined) {
  const API = 'https://graphql-demo.mead.io/';

  const httpLink = createHttpLink({
    uri: API,
    fetch,
    fetchOptions: {
      mode: 'no-cors',
    },
  });

  const cache = new InMemoryCache();

  // If on the client, recover the injected state
  if (!ssrContext && typeof window !== 'undefined') {
    // eslint-disable-next-line no-underscore-dangle
    const state = window.__APOLLO_STATE__;
    if (state) {
      cache.restore(<NormalizedCacheObject>state.default);
    }
  }

  return {
    link: httpLink,
    cache,
    ...(ssrContext ? {
      // Set this on the server to optimize queries when SSR
      ssrMode: true,
    } : {
      // This will temporary disable query force-fetching
      ssrForceFetchDelay: 200,
    }),
    defaultOptions: {
      query: {
        errorPolicy: 'all',
        ...(ssrContext ? {
          fetchPolicy: 'network-only',
        } : {
          fetchPolicy: 'cache-first',
        }),
      },
      watchQuery: {
        errorPolicy: 'all',
        ...(ssrContext ? {
          fetchPolicy: 'network-only',
        } : {
          fetchPolicy: 'cache-and-network',
        }),
      },
    },
  } as ApolloClientOptions<NormalizedCacheObject>;
}

export function storeClientHidratation(
  ssrContext: QSsrContext | null | undefined,
  apolloClients: ApolloClients,
) {
  apolloClientsCache = apolloClients;
  if (process.env.SERVER && ssrContext) {
    ssrContext.renderApolloState = (): string => {
      const nonce = ssrContext.nonce !== void 0
        ? ` nonce="${ssrContext.nonce}" `
        : '';
      const state = exportStates(apolloClients);
      const autoRemove = ';(function(){var s;(s=document.currentScript||document.scripts[document.scripts.length-1]).parentNode.removeChild(s);}());';
      return `<script${nonce}>${state}${autoRemove}</script>`;
    };
  }
}

export function hidrateVM() {
  const ssrContext = process.env.SERVER ? useSSRContext() : null;
  const $vm = getCurrentInstance();
  if ($vm) $vm.$isServer = !!ssrContext;
}

export function getApolloClient(clientId = 'default') {
  return apolloClientsCache[clientId] as ApolloClient<NormalizedCacheObject>;
}

declare module '@quasar/app' {
    interface QSsrContext {
        nonce?: string | undefined;
        renderApolloState?: () => string;
    }
}

declare module '@vue/runtime-core' {
  interface ComponentInternalInstance {
    $isServer: boolean;
  }
}
