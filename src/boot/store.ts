import { boot } from 'quasar/wrappers';
import { Cookies, LocalStorage } from 'quasar';
import createPersistedState from 'vuex-persistedstate';
import { v4 as uuidV4 } from 'uuid';
import CryptoJS, { AES } from 'crypto-js';

const encryptCookie = 'store-key';
const options = { path: '/', secure: !process.env.DEV, expires: 365 };

export default boot(({ store, ssrContext }) => {
  const cookies = process.env.SERVER && ssrContext
    ? Cookies.parseSSR(ssrContext)
    : Cookies;

  const storeKey = cookies.get(encryptCookie);
  const encryptionToken = storeKey || uuidV4();
  if (!storeKey) {
    cookies.set(encryptCookie, encryptionToken, options);
  }

  const cookieStorage = {
    getItem: (key: string) => {
      const localStore = cookies.get(key);
      if (localStore) {
        if (typeof localStore !== 'string') return localStore;
        try {
          const bytes = AES.decrypt(localStore, encryptionToken);
          const result:unknown = JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
          return result;
        } catch (e) {
          cookies.remove(key);
        }
      }
      return null;
    },
    setItem: (key: string, value: unknown) => {
      try {
        const localStore = AES.encrypt(JSON.stringify(value), encryptionToken).toString();
        cookies.set(key, localStore, options);
      } catch (e) {
        cookies.set(key, JSON.stringify(value), options);
      }
    },
    removeItem: (key: string) => cookies.remove(key),
  };

  const localBrowserStore = {
    getItem: (key: string) => {
      if (!ssrContext) {
        try {
          return LocalStorage.getItem(key);
        } catch (e) {
          LocalStorage.remove(key);
        }
      }
      return null;
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    setItem: (key: string, value: any) => {
      if (!ssrContext) {
        try {
          LocalStorage.set(key, value);
        // eslint-disable-next-line no-empty
        } catch (e) {}
      }
    },
    removeItem: (key: string) => { if (!ssrContext) { LocalStorage.remove(key); } },
  };

  createPersistedState({
    paths: ['users'],
    key: 'users-storage',
    storage: cookieStorage,
    getState: cookieStorage.getItem,
    setState: cookieStorage.setItem,
  })(store);
  createPersistedState({
    paths: ['trips'],
    key: 'trips-storage',
    storage: localBrowserStore,
    getState: localBrowserStore.getItem,
    setState: localBrowserStore.setItem,
  })(store);
});
