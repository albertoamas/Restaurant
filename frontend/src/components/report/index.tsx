/**
 * Componentes reutilizables del módulo de Reportes.
 */

import type { TopProductDto, TopCustomerDto } from '@pos/shared';

/* ── Rank colors ──────────────────────────────────────────────────────────── */

export const RANK_COLORS = [
  'bg-amber-400',
  'bg-slate-400',
  'bg-amber-700',
];

/* ── StatCard ─────────────────────────────────────────────────────────────── */

export interface StatCardProps {
  label:  string;
  value:  string;
  icon:   React.ReactNode;
  accent: string;
  bg:     string;
}

export function StatCard({ label, value, icon, accent, bg }: StatCardProps) {
  return (
    <div className="relative rounded-2xl border border-white/8 shadow-[0_8px_28px_oklch(0.06_0.010_38/0.6)] p-5 flex flex-col gap-4 overflow-hidden" style={{ background: 'var(--color-surface-card)' }}>
      {/* Accent orb de fondo */}
      <div className={`absolute -top-6 -right-6 w-28 h-28 rounded-full opacity-25 blur-2xl ${bg}`} />

      <div className={`relative w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm [&_svg]:w-[20px] [&_svg]:h-[20px] ${bg} ${accent}`}>
        {icon}
      </div>
      <div className="relative">
        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1">{label}</p>
        <p className="font-heading font-black text-2xl text-gray-900 leading-tight">{value}</p>
      </div>
    </div>
  );
}

/* ── PaymentBar ───────────────────────────────────────────────────────────── */

export interface PaymentBarProps {
  label:  string;
  amount: number;
  total:  number;
  color:  string;
}

export function PaymentBar({ label, amount, total, color }: PaymentBarProps) {
  const pct = total > 0 ? (amount / total) * 100 : 0;
  return (
    <div>
      <div className="flex justify-between text-sm mb-2">
        <span className="text-gray-600 font-medium">{label}</span>
        <div className="flex items-baseline gap-1.5">
          <span className="font-heading font-bold text-gray-900">Bs {amount.toFixed(2)}</span>
          <span className="text-[11px] text-gray-400 tabular-nums">{pct.toFixed(0)}%</span>
        </div>
      </div>
      <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-[width] duration-700 ease-out ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

/* ── TypeRow ──────────────────────────────────────────────────────────────── */

export interface TypeRowProps {
  label: string;
  count: number;
  total: number;
  color: string;
}

export function TypeRow({ label, count, total, color }: TypeRowProps) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-gray-600 font-medium">{label}</span>
        <div className="flex items-center gap-2">
          <span className="font-heading font-bold text-sm text-gray-900">{count}</span>
          <span className="text-[11px] font-semibold text-gray-400 tabular-nums">{pct}%</span>
        </div>
      </div>
      <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-[width] duration-700 ease-out ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

/* ── TopProductRow ────────────────────────────────────────────────────────── */

export interface TopProductRowProps {
  rank:    number;
  product: TopProductDto;
  maxQty:  number;
}

export function TopProductRow({ rank, product, maxQty }: TopProductRowProps) {
  const pct    = maxQty > 0 ? (product.totalQuantity / maxQty) * 100 : 0;
  const isTop3 = rank <= 3;

  return (
    <div className="flex items-center gap-3 py-0.5">
      <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-[11px] font-black ${
        isTop3 ? `${RANK_COLORS[rank - 1]} text-white` : 'bg-gray-100 text-gray-400'
      }`}>
        {rank}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1.5 gap-2">
          <span className="text-sm font-semibold text-gray-800 truncate leading-tight">{product.productName}</span>
          <div className="flex items-center gap-2 shrink-0">
            <span className="font-heading font-bold text-sm text-gray-900 tabular-nums">
              {product.totalQuantity} uds
            </span>
            <span className="text-xs text-gray-400 tabular-nums w-20 text-right">
              Bs {product.totalRevenue.toFixed(2)}
            </span>
          </div>
        </div>
        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-[width] duration-700 ease-out ${
              rank === 1 ? 'bg-primary-500' : rank === 2 ? 'bg-primary-400' : rank === 3 ? 'bg-primary-300' : 'bg-gray-200'
            }`}
            style={{ width: `${pct}%` }}
          />
        </div>
        {product.categoryName && (
          <span className="text-[10px] text-gray-400 font-medium mt-0.5 inline-block">{product.categoryName}</span>
        )}
      </div>
    </div>
  );
}

/* ── TopCustomerRow ───────────────────────────────────────────────────────── */

export interface TopCustomerRowProps {
  rank:     number;
  customer: TopCustomerDto;
  maxSpent: number;
}

export function TopCustomerRow({ rank, customer, maxSpent }: TopCustomerRowProps) {
  const pct    = maxSpent > 0 ? (customer.totalSpent / maxSpent) * 100 : 0;
  const isTop3 = rank <= 3;

  return (
    <div className="flex items-center gap-3 py-0.5">
      <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-[11px] font-black ${
        isTop3 ? `${RANK_COLORS[rank - 1]} text-white` : 'bg-gray-100 text-gray-400'
      }`}>
        {rank}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1.5 gap-2">
          <div className="min-w-0">
            <span className="text-sm font-semibold text-gray-800 truncate leading-tight block">
              {customer.customerName}
            </span>
            {customer.customerPhone && (
              <span className="text-[10px] text-gray-400 font-medium">{customer.customerPhone}</span>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs text-gray-400 tabular-nums">{customer.orderCount} ped.</span>
            <span className="font-heading font-bold text-sm text-gray-900 tabular-nums w-24 text-right">
              Bs {customer.totalSpent.toFixed(2)}
            </span>
          </div>
        </div>
        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-[width] duration-700 ease-out ${
              rank === 1 ? 'bg-emerald-500' : rank === 2 ? 'bg-emerald-400' : rank === 3 ? 'bg-emerald-300' : 'bg-gray-200'
            }`}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
    </div>
  );
}
