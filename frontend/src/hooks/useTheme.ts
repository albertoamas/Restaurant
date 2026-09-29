import { useCallback, useEffect, useState } from 'react';
import { THEME_COLORS } from '../theme-colors';

export type Theme = 'dark' | 'light';

/**
 * Guarda solo la elección explícita del usuario (al alternar el tema), nunca el valor por
 * defecto. Clave nueva: la anterior (`pos_theme`) se escribía al cargar la app, así que casi
 * todos tenían "oscuro" guardado sin haberlo elegido y el cambio a tema claro predeterminado
 * no les habría llegado.
 */
const STORAGE_KEY = 'pos_color_theme';
const LEGACY_KEY  = 'pos_theme';

function getStored(): Theme {
  try {
    localStorage.removeItem(LEGACY_KEY);
    const v = localStorage.getItem(STORAGE_KEY);
    if (v === 'dark' || v === 'light') return v;
  } catch {}
  return 'light';
}

function applyTheme(t: Theme) {
  if (t === 'dark') {
    document.documentElement.setAttribute('data-theme', 'dark');
  } else {
    document.documentElement.removeAttribute('data-theme');
  }
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', THEME_COLORS[t]);
}

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(getStored);

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  const toggle = useCallback(() => {
    setTheme((t) => {
      const next = t === 'dark' ? 'light' : 'dark';
      try { localStorage.setItem(STORAGE_KEY, next); } catch { /* sin storage: vale para esta sesión */ }
      return next;
    });
  }, []);

  return { theme, toggle };
}
