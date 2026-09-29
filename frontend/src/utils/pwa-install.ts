/**
 * Estado de instalación de la PWA como store externo (para `useSyncExternalStore`).
 *
 * Por qué fuera de React: Chrome dispara `beforeinstallprompt` una sola vez y muy temprano,
 * a menudo antes de que monte el componente que muestra el botón "Instalar". Si el listener
 * viviera en un componente, el evento se perdería. `initPwaInstall()` se llama en `main.tsx`
 * antes del primer render.
 *
 * Modos:
 *  - 'prompt' → Chrome/Edge/Android: el navegador ofrece su diálogo nativo.
 *  - 'ios'    → iPhone/iPad: no existe el evento; hay que explicar "Compartir → Agregar a inicio".
 *  - 'none'   → ya instalada, o el navegador no permite instalar (Firefox de escritorio).
 */

/** Evento no estándar de Chromium; no está en lib.dom. */
interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export type InstallMode = 'prompt' | 'ios' | 'none';

export interface PwaInstallState {
  installed: boolean;
  mode: InstallMode;
}

export type InstallOutcome = 'accepted' | 'dismissed' | 'unavailable';

/** Lo mínimo de `window` que usa el store — permite testearlo sin navegador real. */
export type PwaWindow = Pick<Window, 'addEventListener' | 'matchMedia'> & {
  navigator: Pick<Navigator, 'userAgent' | 'maxTouchPoints'> & { standalone?: boolean };
};

export function isStandalone(win: PwaWindow): boolean {
  // `navigator.standalone` es la variante de Safari en iOS.
  return win.matchMedia('(display-mode: standalone)').matches || win.navigator.standalone === true;
}

export function isIos(nav: PwaWindow['navigator']): boolean {
  // Desde iPadOS 13 el iPad se identifica como Mac: lo delata la pantalla táctil.
  return /iPad|iPhone|iPod/.test(nav.userAgent)
    || (/Macintosh/.test(nav.userAgent) && nav.maxTouchPoints > 1);
}

export function createPwaInstallStore(win: PwaWindow) {
  let deferred: BeforeInstallPromptEvent | null = null;
  let installed = isStandalone(win);
  const ios = isIos(win.navigator);
  const listeners = new Set<() => void>();

  const compute = (): PwaInstallState => ({
    installed,
    mode: installed ? 'none' : deferred ? 'prompt' : ios ? 'ios' : 'none',
  });

  // Snapshot estable: useSyncExternalStore exige la misma referencia mientras nada cambie.
  let snapshot = compute();
  const emit = () => {
    snapshot = compute();
    listeners.forEach((l) => l());
  };

  win.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault(); // sin esto Chrome muestra su propio banner cuando quiere
    deferred = e as BeforeInstallPromptEvent;
    emit();
  });

  win.addEventListener('appinstalled', () => {
    installed = true;
    deferred = null;
    emit();
  });

  return {
    getSnapshot: () => snapshot,
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => { listeners.delete(listener); };
    },
    async promptInstall(): Promise<InstallOutcome> {
      if (!deferred) return 'unavailable';
      const event = deferred;
      // El evento sirve una sola vez, acepte o no el usuario.
      deferred = null;
      await event.prompt();
      const { outcome } = await event.userChoice;
      emit();
      return outcome;
    },
  };
}

export type PwaInstallStore = ReturnType<typeof createPwaInstallStore>;

let store: PwaInstallStore | null = null;

/** Registrar los listeners lo antes posible. Idempotente. */
export function initPwaInstall(): PwaInstallStore {
  store ??= createPwaInstallStore(window);
  return store;
}
