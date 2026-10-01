import { useCallback, useEffect, useState } from 'react';

/**
 * Pantalla completa del navegador (para la tablet de la cocina). `supported` es false donde la
 * API no existe (Safari en iPhone): ahí no se muestra el botón.
 */
export function useFullscreen() {
  const supported = typeof document !== 'undefined' && !!document.documentElement.requestFullscreen;
  const [active, setActive] = useState(() => typeof document !== 'undefined' && !!document.fullscreenElement);

  useEffect(() => {
    const onChange = () => setActive(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, []);

  const toggle = useCallback(() => {
    if (document.fullscreenElement) void document.exitFullscreen();
    else void document.documentElement.requestFullscreen().catch(() => { /* el navegador lo rechazó */ });
  }, []);

  return { supported, active, toggle };
}
