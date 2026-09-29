import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTheme } from './useTheme';
import { THEME_COLORS } from '../theme-colors';

const themeColor = () =>
  document.querySelector('meta[name="theme-color"]')?.getAttribute('content');

describe('useTheme', () => {
  beforeEach(() => {
    localStorage.clear();
    document.head.innerHTML = '<meta name="theme-color" content="#000000" />';
    document.documentElement.removeAttribute('data-theme');
  });

  it('arranca en oscuro y pinta la barra con el fondo oscuro', () => {
    renderHook(() => useTheme());
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    expect(themeColor()).toBe(THEME_COLORS.dark);
  });

  it('al cambiar a claro actualiza data-theme, theme-color y lo recuerda', () => {
    const { result } = renderHook(() => useTheme());
    act(() => result.current.toggle());

    expect(document.documentElement.hasAttribute('data-theme')).toBe(false);
    expect(themeColor()).toBe(THEME_COLORS.light);
    expect(localStorage.getItem('pos_theme')).toBe('light');
  });

  it('respeta el tema guardado', () => {
    localStorage.setItem('pos_theme', 'light');
    renderHook(() => useTheme());
    expect(themeColor()).toBe(THEME_COLORS.light);
  });
});
