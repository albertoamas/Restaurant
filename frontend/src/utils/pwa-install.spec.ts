import { describe, it, expect, vi } from 'vitest';
import { createPwaInstallStore, isIos, type PwaWindow } from './pwa-install';

const CHROME_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/140.0 Safari/537.36';
const IPHONE_UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Version/18.0 Mobile/15E148 Safari/604.1';
const IPAD_UA   = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 Version/18.0 Safari/605.1.15';

function fakeWindow({ ua = CHROME_UA, touch = 0, standalone = false } = {}) {
  const target = new EventTarget();
  return Object.assign(target, {
    matchMedia: () => ({ matches: standalone }),
    navigator: { userAgent: ua, maxTouchPoints: touch },
  }) as unknown as PwaWindow & EventTarget;
}

function installPromptEvent(outcome: 'accepted' | 'dismissed') {
  const event = new Event('beforeinstallprompt', { cancelable: true });
  return Object.assign(event, {
    prompt: vi.fn(() => Promise.resolve()),
    userChoice: Promise.resolve({ outcome }),
  });
}

describe('isIos', () => {
  it('reconoce iPhone y el iPad que se presenta como Mac táctil', () => {
    expect(isIos({ userAgent: IPHONE_UA, maxTouchPoints: 5 })).toBe(true);
    expect(isIos({ userAgent: IPAD_UA,   maxTouchPoints: 5 })).toBe(true);
  });

  it('no confunde un Mac de escritorio ni Chrome en Windows', () => {
    expect(isIos({ userAgent: IPAD_UA,   maxTouchPoints: 0 })).toBe(false);
    expect(isIos({ userAgent: CHROME_UA, maxTouchPoints: 0 })).toBe(false);
  });
});

describe('createPwaInstallStore', () => {
  it('sin evento del navegador no ofrece instalar', () => {
    const store = createPwaInstallStore(fakeWindow());
    expect(store.getSnapshot()).toEqual({ installed: false, mode: 'none' });
  });

  it('en iOS ofrece las instrucciones manuales', () => {
    const store = createPwaInstallStore(fakeWindow({ ua: IPHONE_UA, touch: 5 }));
    expect(store.getSnapshot().mode).toBe('ios');
  });

  it('abierta como app instalada no ofrece nada, ni siquiera en iOS', () => {
    const store = createPwaInstallStore(fakeWindow({ ua: IPHONE_UA, touch: 5, standalone: true }));
    expect(store.getSnapshot()).toEqual({ installed: true, mode: 'none' });
  });

  it('captura beforeinstallprompt, suprime el banner del navegador y avisa a los suscriptores', () => {
    const win = fakeWindow();
    const store = createPwaInstallStore(win);
    const listener = vi.fn();
    store.subscribe(listener);

    const event = installPromptEvent('accepted');
    win.dispatchEvent(event);

    expect(event.defaultPrevented).toBe(true);
    expect(store.getSnapshot().mode).toBe('prompt');
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('el snapshot conserva su referencia mientras nada cambie', () => {
    const store = createPwaInstallStore(fakeWindow());
    expect(store.getSnapshot()).toBe(store.getSnapshot());
  });

  it('promptInstall usa el evento una sola vez', async () => {
    const win = fakeWindow();
    const store = createPwaInstallStore(win);
    const event = installPromptEvent('dismissed');
    win.dispatchEvent(event);

    await expect(store.promptInstall()).resolves.toBe('dismissed');
    expect(event.prompt).toHaveBeenCalledTimes(1);
    expect(store.getSnapshot().mode).toBe('none');
    await expect(store.promptInstall()).resolves.toBe('unavailable');
  });

  it('appinstalled marca la app como instalada', () => {
    const win = fakeWindow();
    const store = createPwaInstallStore(win);
    win.dispatchEvent(installPromptEvent('accepted'));

    win.dispatchEvent(new Event('appinstalled'));

    expect(store.getSnapshot()).toEqual({ installed: true, mode: 'none' });
  });
});
