import type { RaffleStatus } from '@pos/shared';

/**
 * Un color por estado del sorteo: activo (se emiten tickets) verde, cerrado ámbar, sorteando
 * naranja de la marca y sorteado gris neutro (terminado).
 */
export const STATUS_CONFIG: Record<RaffleStatus, { label: string; badge: string; strip: string; dot: string }> = {
  ACTIVE:  { label: 'Activo',    badge: 'bg-emerald-500/12 text-emerald-700 dark:text-emerald-300 border border-emerald-500/25', strip: 'border-l-emerald-500', dot: 'bg-emerald-500' },
  CLOSED:  { label: 'Cerrado',   badge: 'bg-amber-500/14 text-amber-800 dark:text-amber-300 border border-amber-500/30',         strip: 'border-l-amber-500',   dot: 'bg-amber-500' },
  DRAWING: { label: 'Sorteando', badge: 'bg-primary-500/12 text-primary-700 dark:text-primary-400 border border-primary-500/25',  strip: 'border-l-primary-500', dot: 'bg-primary-500' },
  DRAWN:   { label: 'Sorteado',  badge: 'bg-surface-2 text-soft border border-line',                                              strip: 'border-l-line-strong', dot: 'bg-muted' },
};

export function StatusBadge({ status }: { status: RaffleStatus }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.CLOSED;
  return (
    <span className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-0.5 text-caption font-semibold whitespace-nowrap ${cfg.badge}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}
