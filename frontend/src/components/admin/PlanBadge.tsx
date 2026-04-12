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
    badge: 'bg-gray-100 text-gray-600 border-gray-200',
    card: 'border-gray-200 bg-gray-50/60',
    cardActive: 'border-gray-300 bg-white ring-2 ring-gray-300/70',
    accent: 'text-gray-900',
  },
  [SaasPlan.PRO]: {
    label: 'Pro',
    badge: 'bg-primary-100 text-primary-700 border-primary-200',
    card: 'border-primary-200/60 bg-primary-50/40',
    cardActive: 'border-primary-300 bg-primary-50/60 ring-2 ring-primary-200/70',
    accent: 'text-primary-700',
  },
  [SaasPlan.NEGOCIO]: {
    label: 'Negocio',
    badge: 'bg-violet-100 text-violet-700 border-violet-200',
    card: 'border-violet-200/60 bg-violet-50/40',
    cardActive: 'border-violet-300 bg-violet-50/60 ring-2 ring-violet-200/70',
    accent: 'text-violet-700',
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
