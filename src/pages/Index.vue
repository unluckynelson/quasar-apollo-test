<template>
  <q-page class="row items-center justify-evenly">
    Query Results: <br/>
    {{ me }}
  </q-page>
</template>

<script lang="ts">
import { defineComponent, computed } from 'vue';
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

    const {
      result,
    } = useQuery(meQuery, {}, {
      errorPolicy: 'all',
    });
    const me = useResult(result, null, (data: meQueryResult) => data.me);
    console.log(me?.value?.name);
    const titleName = computed(() => me?.value?.name);
    useMeta({
      // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
      title: `${titleName.value} | Quasar Apollo Test Page`,
    });
    return { me };
  }
});
</script>
