export const BOLIVIA_TZ     = 'America/La_Paz';
export const BOLIVIA_OFFSET = '-04:00';

/**
 * Devuelve la fecha dada en hora Bolivia como "YYYY-MM-DD".
 * Usa Intl.DateTimeFormat con locale 'en-CA' que produce ese formato directamente.
 * Independiente del timezone del servidor.
 */
export function toBoliviaDateString(date: Date): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: BOLIVIA_TZ }).format(date);
}

/**
 * Dado un "YYYY-MM-DD" en hora Bolivia, devuelve los límites del día como UTC ISO strings.
 *   start = medianoche Bolivia  → 2026-04-11T04:00:00.000Z  (UTC+4h)
 *   end   = 23:59:59 Bolivia    → 2026-04-12T03:59:59.999Z
 */
export function getBoliviaDayBoundsISO(boliviaDateStr: string): { start: string; end: string } {
  return {
    start: new Date(`${boliviaDateStr}T00:00:00${BOLIVIA_OFFSET}`).toISOString(),
    end:   new Date(`${boliviaDateStr}T23:59:59.999${BOLIVIA_OFFSET}`).toISOString(),
  };
}

/** Límites UTC del día de hoy en Bolivia como ISO strings. */
export function getBoliviaTodayBoundsISO(): { start: string; end: string } {
  return getBoliviaDayBoundsISO(toBoliviaDateString(new Date()));
}
