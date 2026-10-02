import { useLayoutEffect } from 'react';
import { useLocation, useNavigationType } from 'react-router-dom';

/**
 * Al ir a otra página la vista empieza arriba. Sin esto, React Router cambia el contenido y el
 * navegador conserva la altura: desde el pie de Privacidad, "Términos" abría al final de Términos.
 *
 * - Atrás y adelante del navegador (POP) no se tocan: devuelven a donde estabas.
 * - Con ancla (`/privacidad#navegador`) salta la página de destino, no esto.
 * - Solo cambia de página el `pathname`: filtros en la URL (`?q=`) no suben la vista.
 */
export function ScrollToTop() {
  const { pathname, hash } = useLocation();
  const navigationType = useNavigationType();

  useLayoutEffect(() => {
    if (navigationType === 'POP' || hash) return;
    window.scrollTo(0, 0);
  }, [pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  return null;
}
