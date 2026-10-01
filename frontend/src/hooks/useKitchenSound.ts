import { useCallback, useEffect, useRef, useState } from 'react';

const STORAGE_KEY = 'pos_kitchen_sound';

function readEnabled(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) !== 'off';
  } catch {
    return true;
  }
}

/**
 * Aviso sonoro de pedido nuevo en la cocina: dos tonos cortos generados con Web Audio (sin
 * archivos). La preferencia se guarda en el equipo, porque cada cocina decide si lo quiere.
 *
 * Los navegadores no dejan sonar audio hasta que la persona toca la pantalla: el contexto se
 * crea (o se reanuda) con el primer toque, y `blocked` avisa mientras eso no pasó.
 */
export function useKitchenSound() {
  const [enabled, setEnabled] = useState(readEnabled);
  const [blocked, setBlocked] = useState(true);
  const ctxRef = useRef<AudioContext | null>(null);

  const unlock = useCallback(() => {
    const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return;
    ctxRef.current ??= new Ctx();
    void ctxRef.current.resume().then(() => setBlocked(ctxRef.current?.state !== 'running'));
  }, []);

  // `click` y no `pointerdown`: al desbloquear desaparece el aviso y el contenido sube; con
  // pointerdown eso pasaba a mitad del toque y el botón tocado no recibía el clic.
  useEffect(() => {
    window.addEventListener('click', unlock);
    window.addEventListener('keydown', unlock);
    return () => {
      window.removeEventListener('click', unlock);
      window.removeEventListener('keydown', unlock);
      void ctxRef.current?.close();
      ctxRef.current = null;
    };
  }, [unlock]);

  const toggle = useCallback(() => {
    setEnabled((on) => {
      const next = !on;
      try { localStorage.setItem(STORAGE_KEY, next ? 'on' : 'off'); } catch { /* sin almacenamiento: vale para esta sesión */ }
      return next;
    });
  }, []);

  const play = useCallback(() => {
    const ctx = ctxRef.current;
    if (!enabled || !ctx || ctx.state !== 'running') return;
    const start = ctx.currentTime;
    [880, 1320].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const t = start + i * 0.18;
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(0.35, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.16);
      osc.connect(gain).connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.17);
    });
  }, [enabled]);

  return { enabled, blocked, toggle, play };
}
