import { useEffect, useState } from 'react';

/**
 * Monto para las marcas del eje: "30k" en vez de "Bs 30000". Con el prefijo y
 * cinco cifras la etiqueta no entra en el ancho del eje y se parte en dos
 * renglones; la unidad la dice el subtítulo del gráfico. El valor exacto, con
 * su "Bs", sigue en el tooltip y en la tabla.
 */
export function formatAmountAxis(v: number | string): string {
  const n = Number(v);
  if (Math.abs(n) < 1000) return n.toFixed(0);
  const k = n / 1000;
  return `${Number.isInteger(k) ? k.toFixed(0) : k.toFixed(1)}k`;
}

/** Monto exacto para tooltips. */
export function formatBsFull(v: number | string): string {
  return `Bs ${Number(v).toFixed(2)}`;
}

/** Día `YYYY-MM-DD` para el eje X: "15 sept". Se lee sin conocer el formato ISO. */
export function formatDayTick(day: string): string {
  return new Intl.DateTimeFormat('es-BO', { timeZone: 'UTC', day: 'numeric', month: 'short' })
    .format(new Date(`${day}T12:00:00Z`));
}

const REDUCED_MOTION = '(prefers-reduced-motion: reduce)';

/**
 * Si los gráficos animan su entrada. Se apaga cuando el equipo pide reducir el movimiento
 * (ajuste de accesibilidad del sistema).
 */
export function useChartAnimation(): boolean {
  const [reduced, setReduced] = useState(
    () => typeof window !== 'undefined' && !!window.matchMedia?.(REDUCED_MOTION).matches,
  );
  useEffect(() => {
    const query = window.matchMedia?.(REDUCED_MOTION);
    if (!query) return;
    const onChange = () => setReduced(query.matches);
    query.addEventListener('change', onChange);
    return () => query.removeEventListener('change', onChange);
  }, []);
  return !reduced;
}
