import { useRegisterSW } from 'virtual:pwa-register/react';

/**
 * El POS queda abierto todo el día: sin un chequeo periódico, el service worker solo
 * buscaría una versión nueva al navegar y un cajero podría pasar jornadas en una versión vieja.
 */
const UPDATE_CHECK_INTERVAL_MS = 60 * 60 * 1000;
const RELOAD_FALLBACK_MS = 3_000;

// Un solo chequeo periódico por página, aunque el hook se monte más de una vez.
let updateCheckTimer: ReturnType<typeof setInterval> | undefined;

/**
 * Registra el service worker y avisa cuando hay una versión nueva esperando.
 * En `pnpm dev` el módulo virtual es un stub que no registra nada.
 *
 * Único punto que importa `virtual:pwa-register`: los tests mockean este hook, no el módulo
 * virtual (Vitest no corre el plugin PWA y no podría resolverlo).
 */
export function usePwaUpdate() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_swUrl, registration) {
      if (!registration) return;
      clearInterval(updateCheckTimer);
      updateCheckTimer = setInterval(() => {
        if (!navigator.onLine || registration.installing) return;
        // Un fallo de red al chequear no es un error para el usuario: se reintenta en una hora.
        registration.update().catch(() => undefined);
      }, UPDATE_CHECK_INTERVAL_MS);
    },
  });

  return {
    needRefresh,
    /** Activa la versión nueva y recarga la página. */
    update: async () => {
      await updateServiceWorker(true);
      // La recarga la dispara el cambio de controlador. Si la página aún no estaba controlada
      // (primera visita justo durante un deploy) ese evento no llega y el botón no haría nada:
      // se recarga igual. En el caso normal la recarga ocurre antes y este timer muere con ella.
      setTimeout(() => window.location.reload(), RELOAD_FALLBACK_MS);
    },
    /** Oculta el aviso; la versión nueva se activa sola al cerrar todas las pestañas de la app. */
    dismiss: () => setNeedRefresh(false),
  };
}
