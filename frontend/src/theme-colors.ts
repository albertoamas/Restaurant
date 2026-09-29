/**
 * Colores de marca y de fondo en sRGB, para los lugares que no leen las variables CSS:
 * el manifest de la PWA, los íconos generados y `<meta name="theme-color">`.
 * Derivan de `styles/index.css` (convertidos de oklch). Sin dependencias: lo importan
 * `vite.config.ts` y `pwa-assets.config.ts`, que corren en Node.
 *
 * El script anti-FOUC de `index.html` repite los dos fondos a mano: no puede importar
 * módulos (va inline y la CSP lo autoriza por hash).
 */

/** `--color-primary-500` = oklch(0.65 0.22 42). */
export const BRAND_COLOR = '#f54d00';

/** `--surface-page` de cada tema: la barra del navegador se funde con el Header. */
export const THEME_COLORS = {
  dark:  '#060302', // oklch(0.10 0.012 38)
  light: '#f9f4f2', // oklch(0.97 0.006 50)
} as const;
