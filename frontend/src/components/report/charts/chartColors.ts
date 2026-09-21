import { useEffect, useState } from 'react';

export interface ChartPalette {
  primary: string;
  emerald: string;
  violet:  string;
  amber:   string;
  sky:     string;
  rose:    string;
  cyan:    string;
  lime:    string;
  /** Rojo puro — reservado para "negativo" (positivo/negativo), distinto de `rose` (identidad de Gastos). */
  red:     string;
  /** Identidad reservada para relleno/"Otros" — nunca una serie con nombre (falla el piso de croma como identidad). */
  gray:    string;
  /** Línea de grilla (`CartesianGrid`) — tenue sobre la superficie de cada tema. */
  grid:    string;
}

/**
 * Superficie clara (`--surface-card` #ffffff). Orden validado con
 * `validate_palette.js` (dataviz skill) — separa primary/amber, que antes
 * quedaban casi idénticos en categorías de 4+ series.
 */
const LIGHT: ChartPalette = {
  primary: '#f97316',
  emerald: '#10b981',
  violet:  '#8b5cf6',
  amber:   '#f59e0b',
  sky:     '#0ea5e9',
  rose:    '#f43f5e',
  cyan:    '#06b6d4',
  lime:    '#84cc16',
  red:     '#ef4444',
  gray:    '#6b7280',
  grid:    'rgba(0,0,0,0.08)',
};

/**
 * Superficie oscura (`--surface-card` #100806). Mismos hues re-escalonados a
 * la banda oscura (L 0.48–0.67) — mismo método que ya usa `index.css` para
 * `--color-primary-*` entre modos.
 */
const DARK: ChartPalette = {
  primary: '#ea580c',
  emerald: '#059669',
  violet:  '#8b5cf6',
  amber:   '#d97706',
  sky:     '#0284c7',
  rose:    '#f43f5e',
  cyan:    '#0891b2',
  lime:    '#65a30d',
  red:     '#dc2626',
  gray:    '#6b7280',
  grid:    'rgba(255,255,255,0.06)',
};

/** Set estático (modo claro) — para piezas que aún no leen el tema activo. */
export const C = LIGHT;

export const TICK_COLOR   = '#9ca3af';
export const TICK_SIZE    = 11;

function isDarkTheme(): boolean {
  return document.documentElement.getAttribute('data-theme') === 'dark';
}

/** Sigue `data-theme` en <html> (ver `useTheme.ts`) sin duplicar su estado. */
function useIsDarkTheme(): boolean {
  const [isDark, setIsDark] = useState(isDarkTheme);

  useEffect(() => {
    const observer = new MutationObserver(() => setIsDark(isDarkTheme()));
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => observer.disconnect();
  }, []);

  return isDark;
}

/** Paleta de gráficos válida para el tema activo — claro u oscuro. */
export function useChartColors(): ChartPalette {
  const isDark = useIsDarkTheme();
  return isDark ? DARK : LIGHT;
}

/**
 * 8 hues de identidad para gráficos categóricos (p. ej. `CategoryBarChart`),
 * en el orden validado — no reordenar sin volver a correr el validador.
 */
export function useBarColors(): string[] {
  const c = useChartColors();
  return [c.primary, c.emerald, c.violet, c.amber, c.sky, c.rose, c.cyan, c.lime];
}
