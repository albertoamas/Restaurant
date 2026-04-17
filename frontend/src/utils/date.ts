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

export function formatBoliviaTime(iso: string): string {
  return new Intl.DateTimeFormat('es-BO', {
    timeZone: BOLIVIA_TZ,
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso));
}
