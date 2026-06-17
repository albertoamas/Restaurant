import { SaasPlan } from '@pos/shared';

export function limitLabel(n: number) {
  return n === -1 ? '∞' : String(n);
}

export const PLAN_CONFIG: Record<SaasPlan, {
  label: string;
  badge: string;
  card: string;
  cardActive: string;
  accent: string;
}> = {
  [SaasPlan.BASICO]: {
    label: 'Básico',
    badge: 'bg-[var(--color-surface-2)] text-gray-600 border-[var(--border-subtle)]',
    card: 'border-[var(--border-subtle)] bg-[var(--color-surface-2)]',
    cardActive: 'border-[var(--border-strong)] bg-[var(--color-surface-3)] ring-1 ring-[var(--border-subtle)]',
    accent: 'text-gray-700',
  },
  [SaasPlan.PRO]: {
    label: 'Pro',
    badge: 'bg-primary-500/10 text-primary-600 border-primary-500/20',
    card: 'border-primary-500/20 bg-primary-500/5',
    cardActive: 'border-primary-500/50 bg-primary-500/12 ring-1 ring-primary-500/25',
    accent: 'text-primary-400',
  },
  [SaasPlan.NEGOCIO]: {
    label: 'Negocio',
    badge: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
    card: 'border-violet-500/20 bg-violet-500/5',
    cardActive: 'border-violet-500/50 bg-violet-500/12 ring-1 ring-violet-500/25',
    accent: 'text-violet-400',
  },
};

export function PlanBadge({ plan }: { plan: SaasPlan }) {
  const cfg = PLAN_CONFIG[plan];
  return (
    <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${cfg.badge}`}>
      {cfg.label}
    </span>
  );
}
