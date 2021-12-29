<template>
  <q-page class="row items-center justify-evenly">
    Query Results: <br/>
    {{ me }}<br/><br/>

    User: {{ me.name }}
  </q-page>
</template>

<script lang="ts">
import { defineComponent, computed, useSSRContext, getCurrentInstance } from 'vue';
import gql from 'graphql-tag';
import {useQuery, useResult} from '@vue/apollo-composable';
import { useMeta} from 'quasar';

// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
const meQuery = gql`
  query me {
    me {
      id
      name
      email
    }
  }
`;

declare type meQueryResult = {
  me: {
    id: string
    name: string
    email: string
  }
}

export default defineComponent({
  name: 'PageIndex',
  setup() {

    // Set $isServer param as per https://github.com/vuejs/apollo/issues/1100#issuecomment-899701791
    // This does not seem to make a difference and values are still undefined on server side
    const ssrContext = process.env.SERVER ? useSSRContext() : null;
    const $vm = getCurrentInstance();
    if ($vm) $vm.$isServer = !!ssrContext;

    const {
      result,
    } = useQuery(meQuery, {}, {
      prefetch: true,
      errorPolicy: 'all',
    });
    const me = useResult(result, null, (data: meQueryResult) => data.me);

    // This will be undefined in the server's console
    // even though ssr will output the value in the html
    console.log('User\'s name:', me?.value?.name);

    const titleName = computed(() => me?.value?.name);

    // The `me.name` is undefined in the initial SSR get call
    // but is rendered and in the __APPOLO_STATE__ object
    // How to test:
    // curl --location --request GET 'http://localhost:8080/' | grep User:

    useMeta({
      // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
      title: `User: ${titleName.value} | Quasar Apollo Test Page`,
    });
    return { me };
  }
});
</script>
