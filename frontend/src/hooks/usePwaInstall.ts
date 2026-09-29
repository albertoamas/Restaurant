import { useSyncExternalStore } from 'react';
import { initPwaInstall } from '../utils/pwa-install';

/** `mode` dice qué ofrecer: diálogo nativo ('prompt'), instrucciones de iOS ('ios') o nada. */
export function usePwaInstall() {
  const store = initPwaInstall();
  const state = useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot);
  return { ...state, promptInstall: store.promptInstall };
}
