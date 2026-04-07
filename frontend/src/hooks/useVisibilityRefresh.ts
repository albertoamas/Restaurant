import { useEffect } from 'react';

/**
 * Calls `callback` whenever the browser tab becomes visible again
 * (e.g. user returns from another app or tab).
 * The callback must be stable (useCallback) to avoid re-subscribing on every render.
 */
export function useVisibilityRefresh(callback: () => void) {
  useEffect(() => {
    const handler = () => {
      if (document.visibilityState === 'visible') callback();
    };
    document.addEventListener('visibilitychange', handler);
    return () => document.removeEventListener('visibilitychange', handler);
  }, [callback]);
}
