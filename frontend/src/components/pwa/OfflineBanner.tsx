import { useSyncExternalStore } from 'react';
import { Icon } from '../ui/Icon';

function subscribe(onChange: () => void) {
  window.addEventListener('online', onChange);
  window.addEventListener('offline', onChange);
  return () => {
    window.removeEventListener('online', onChange);
    window.removeEventListener('offline', onChange);
  };
}

const getOnline = () => navigator.onLine;

/**
 * La app no funciona sin conexión, pero el service worker sí puede abrirla sin red: este
 * aviso explica por qué nada carga, en vez de dejar al usuario frente a errores sueltos.
 * Global (no en el Header) para que también se vea en /kitchen y /login.
 */
export function OfflineBanner() {
  const online = useSyncExternalStore(subscribe, getOnline, () => true);
  if (online) return null;

  return (
    <div
      data-print-hide
      role="alert"
      className="fixed z-[60] top-0 inset-x-0 flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold bg-red-600 text-white"
    >
      <Icon name="warning" size={14} className="shrink-0" />
      Sin conexión a internet. Los pedidos y cambios no se guardarán hasta que vuelva.
    </div>
  );
}
