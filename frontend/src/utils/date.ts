import { toBoliviaDateString } from './timezone';

/**
 * Devuelve la fecha de hoy en formato "YYYY-MM-DD" usando la hora de Bolivia (UTC-4),
 * independiente del timezone configurado en el dispositivo.
 */
export function today(): string {
  return toBoliviaDateString(new Date());
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('es-BO', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export function elapsed(createdAt: string): string {
  const diff = Math.floor((Date.now() - new Date(createdAt).getTime()) / 1000);
  if (diff < 60) return `${diff}s`;
  const m = Math.floor(diff / 60);
  const s = diff % 60;
  return `${m}m ${s}s`;
}
