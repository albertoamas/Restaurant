import type { RaffleStatus } from '@pos/shared';

export const STATUS_CONFIG: Record<RaffleStatus, { label: string; badge: string; strip: string; dot: string }> = {
  ACTIVE:   { label: 'Activo',     badge: 'bg-emerald-500/14 text-emerald-300 border border-emerald-500/25', strip: 'bg-emerald-500', dot: 'bg-emerald-400' },
  CLOSED:   { label: 'Cerrado',    badge: 'bg-amber-500/14 text-amber-300 border border-amber-500/25',       strip: 'bg-amber-500',   dot: 'bg-amber-400'   },
  DRAWING:  { label: 'Sorteando',  badge: 'bg-violet-500/14 text-violet-300 border border-violet-500/25',    strip: 'bg-violet-500',  dot: 'bg-violet-400'  },
  DRAWN:    { label: 'Sorteado',   badge: 'bg-indigo-500/14 text-indigo-300 border border-indigo-500/25',    strip: 'bg-indigo-500',  dot: 'bg-indigo-400'  },
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
