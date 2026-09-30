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

  it('sin tema guardado arranca en claro, el predeterminado', () => {
    renderHook(() => useTheme());
    expect(document.documentElement.hasAttribute('data-theme')).toBe(false);
    expect(themeColor()).toBe(THEME_COLORS.light);
  });

  it('al cambiar a oscuro actualiza data-theme, theme-color y lo recuerda', () => {
    const { result } = renderHook(() => useTheme());
    act(() => result.current.toggle());

    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    expect(themeColor()).toBe(THEME_COLORS.dark);
    expect(localStorage.getItem('pos_color_theme')).toBe('dark');
  });

  it('dos pantallas que usan el tema quedan sincronizadas', () => {
    const header  = renderHook(() => useTheme());
    const account = renderHook(() => useTheme());
    act(() => account.result.current.setTheme('dark'));
    expect(header.result.current.theme).toBe('dark');
  });

  it('no guarda nada si el usuario no eligió un tema', () => {
    renderHook(() => useTheme());
    expect(localStorage.getItem('pos_color_theme')).toBeNull();
  });

  it('ignora y borra el "oscuro" que la versión anterior guardaba por defecto', () => {
    localStorage.setItem('pos_theme', 'dark');
    renderHook(() => useTheme());
    expect(document.documentElement.hasAttribute('data-theme')).toBe(false);
    expect(localStorage.getItem('pos_theme')).toBeNull();
  });

  it('respeta el tema oscuro elegido', () => {
    localStorage.setItem('pos_color_theme', 'dark');
    renderHook(() => useTheme());
    expect(themeColor()).toBe(THEME_COLORS.dark);
  });
});
