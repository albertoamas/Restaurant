import type { RaffleStatus } from '@pos/shared';

export const STATUS_CONFIG: Record<RaffleStatus, { label: string; badge: string; strip: string; dot: string }> = {
  ACTIVE:   { label: 'Activo',     badge: 'bg-emerald-100 text-emerald-700', strip: 'bg-emerald-500', dot: 'bg-emerald-500' },
  CLOSED:   { label: 'Cerrado',    badge: 'bg-amber-100 text-amber-700',     strip: 'bg-amber-500',   dot: 'bg-amber-500'   },
  DRAWING:  { label: 'Sorteando',  badge: 'bg-violet-100 text-violet-700',   strip: 'bg-violet-500',  dot: 'bg-violet-500'  },
  DRAWN:    { label: 'Sorteado',   badge: 'bg-indigo-100 text-indigo-700',   strip: 'bg-indigo-500',  dot: 'bg-indigo-500'  },
};

export function StatusBadge({ status }: { status: RaffleStatus }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG['CLOSED'];
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider shrink-0 ${cfg.badge}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}
