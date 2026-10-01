import { BOLIVIA_TZ } from '@pos/shared';
import { toBoliviaDateString } from './timezone';

export function today(): string {
  return toBoliviaDateString(new Date());
}

export function formatDate(iso: string): string {
  return new Intl.DateTimeFormat('es-BO', {
    timeZone: BOLIVIA_TZ,
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  }).format(new Date(iso));
}

export function elapsed(createdAt: string): string {
  const diff = Math.floor((Date.now() - new Date(createdAt).getTime()) / 1000);
  if (diff < 60) return `${diff}s`;
  const m = Math.floor(diff / 60);
  const s = diff % 60;
  return `${m}m ${s}s`;
}

/** Minutos enteros entre dos momentos (nunca negativos). */
export function minutesBetween(from: string, to: string | number = Date.now()): number {
  const end = typeof to === 'number' ? to : new Date(to).getTime();
  return Math.max(0, Math.floor((end - new Date(from).getTime()) / 60_000));
}

/** Duración legible en minutos: "menos de 1 min", "12 min", "1 h 5 min", "1 día 11 h". */
export function durationLabel(minutes: number): string {
  if (minutes < 1) return 'menos de 1 min';
  if (minutes < 60) return `${minutes} min`;
  if (minutes >= 1440) {
    // Con días, los minutos ya no aportan: una caja abierta desde ayer.
    const d = Math.floor(minutes / 1440);
    const hours = Math.floor((minutes % 1440) / 60);
    const days = d === 1 ? '1 día' : `${d} días`;
    return hours === 0 ? days : `${days} ${hours} h`;
  }
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h} h` : `${h} h ${m} min`;
}

/** Tiempo transcurrido para listas en vivo: "Hace un momento", "Hace 12 min", "Hace 1 h 5 min". */
export function timeAgo(iso: string, now: number = Date.now()): string {
  const m = minutesBetween(iso, now);
  return m < 1 ? 'Hace un momento' : `Hace ${durationLabel(m)}`;
}

export function elapsedBetween(from: string, to: string): string {
  const diff = Math.floor((new Date(to).getTime() - new Date(from).getTime()) / 1000);
  if (diff < 60) return `${diff}s`;
  const m = Math.floor(diff / 60);
  const s = diff % 60;
  return `${m}m ${s}s`;
}

/**
 * Días calendario entre dos fechas `YYYY-MM-DD`, ambas incluidas. Las entradas
 * ya son días de Bolivia, así que se recorren en UTC con ancla al mediodía: la
 * aritmética de fechas nunca cruza de día por la zona del navegador.
 */
export function eachDay(from: string, to: string): string[] {
  const days: string[] = [];
  const cursor = new Date(`${from}T12:00:00Z`);
  const end    = new Date(`${to}T12:00:00Z`);
  while (cursor <= end) {
    days.push(cursor.toISOString().slice(0, 10));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return days;
}

/** Fecha compacta para listados: "21 sep". Siempre en hora de Bolivia. */
export function formatBoliviaDateShort(iso: string): string {
  return new Intl.DateTimeFormat('es-BO', {
    timeZone: BOLIVIA_TZ,
    day: '2-digit', month: 'short',
  }).format(new Date(iso));
}

/** Día y mes para usar dentro de una frase: "28 de septiembre". En hora de Bolivia. */
export function formatBoliviaDayMonth(iso: string): string {
  return new Intl.DateTimeFormat('es-BO', {
    timeZone: BOLIVIA_TZ,
    day: 'numeric', month: 'long',
  }).format(new Date(iso));
}

export function formatBoliviaTime(iso: string): string {
  return new Intl.DateTimeFormat('es-BO', {
    timeZone: BOLIVIA_TZ,
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso));
}

/** Día `YYYY-MM-DD` (ya en hora de Bolivia) como Date al mediodía UTC: formatearlo no cruza de día. */
const dayAtNoon = (day: string) => new Date(`${day}T12:00:00Z`);

const dayMonth = (day: string) =>
  new Intl.DateTimeFormat('es-BO', { timeZone: 'UTC', day: 'numeric', month: 'long' }).format(dayAtNoon(day));

/**
 * Período en palabras para encabezados: "29 de septiembre", "Del 22 al 29 de septiembre",
 * "Del 30 de agosto al 2 de septiembre". Recibe días `YYYY-MM-DD` de Bolivia.
 */
export function formatDayRange(from: string, to: string): string {
  if (from === to) return dayMonth(from);
  const sameMonth = from.slice(0, 7) === to.slice(0, 7);
  const start = sameMonth ? String(Number(from.slice(8, 10))) : dayMonth(from);
  return `Del ${start} al ${dayMonth(to)}`;
}

/** Lunes de la semana del día dado (`YYYY-MM-DD`), en el mismo formato. */
export function mondayOf(day: string): string {
  const d = dayAtNoon(day);
  const offset = (d.getUTCDay() + 6) % 7; // lunes = 0
  d.setUTCDate(d.getUTCDate() - offset);
  return d.toISOString().slice(0, 10);
}

/** Día `YYYY-MM-DD` de Bolivia con su nombre, para encabezados: "Lunes 28 de septiembre". */
export function formatWeekdayDay(day: string): string {
  const s = new Intl.DateTimeFormat('es-BO', { timeZone: 'UTC', weekday: 'long', day: 'numeric', month: 'long' })
    .format(new Date(`${day}T12:00:00Z`))
    .replace(',', '');
  return s.charAt(0).toUpperCase() + s.slice(1);
}
