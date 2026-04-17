import { BOLIVIA_TZ, BOLIVIA_OFFSET } from '@pos/shared';

/**
 * Devuelve la fecha dada en hora Bolivia como "YYYY-MM-DD".
 * Independiente del timezone configurado en el dispositivo del usuario.
 */
export function toBoliviaDateString(date: Date): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: BOLIVIA_TZ }).format(date);
}

/**
 * Dado un "YYYY-MM-DD" en hora Bolivia, devuelve los límites del día como UTC ISO strings,
 * listos para enviar al backend como query params `from` y `to`.
 *   start → medianoche Bolivia en UTC  (e.g. 2026-04-11T04:00:00.000Z)
 *   end   → 23:59:59.999 Bolivia en UTC
 */
export function getBoliviaDayBounds(boliviaDateStr: string): { start: string; end: string } {
  return {
    start: new Date(`${boliviaDateStr}T00:00:00${BOLIVIA_OFFSET}`).toISOString(),
    end:   new Date(`${boliviaDateStr}T23:59:59.999${BOLIVIA_OFFSET}`).toISOString(),
  };
}
