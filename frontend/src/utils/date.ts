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

export function formatBoliviaTime(iso: string): string {
  return new Intl.DateTimeFormat('es-BO', {
    timeZone: BOLIVIA_TZ,
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso));
}
