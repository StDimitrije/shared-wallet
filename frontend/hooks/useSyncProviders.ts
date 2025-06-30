import { useSyncExternalStore } from "react"
import { store } from "./store";

/**
 * This hook allows you to subscribe to MetaMask events, read updated values, and update components. 
 * It uses the store.value and store.subscribe methods defined in the store.ts hook.
 */
export const useSyncProviders = () =>
  useSyncExternalStore(store.subscribe, store.value, store.value);

