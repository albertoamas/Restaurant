/**
 * Componentes reutilizables del módulo de Reportes.
 */

import type { ReactNode } from 'react';
import type { TopProductDto, TopCustomerDto } from '@pos/shared';
import { Card } from '../ui/Card';

/* ── Kpi ──────────────────────────────────────────────────────────────────── */

const KPI_TONE = {
  neutral:  'text-main',
  positive: 'text-emerald-700 dark:text-emerald-300',
  negative: 'text-red-700 dark:text-red-300',
};

/** Cifra principal de una sección: etiqueta, valor y una línea de contexto opcional. */
export function Kpi({ label, value, tone = 'neutral', sub }: {
  label: string;
  value: string;
  tone?: keyof typeof KPI_TONE;
  sub?: ReactNode;
}) {
  return (
    <Card padding="sm">
      <p className="text-label text-soft">{label}</p>
      <p className={`mt-0.5 text-heading sm:text-title font-bold font-heading tabular-nums whitespace-nowrap ${KPI_TONE[tone]}`}>{value}</p>
      {sub && <p className="mt-0.5 text-caption text-muted">{sub}</p>}
    </Card>
  );
}

/* ── ChartCard ────────────────────────────────────────────────────────────── */

/** Tarjeta de cada bloque del reporte: título, qué muestra y, a la derecha, un control opcional. */
export function ChartCard({ title, description, action, className = '', children }: {
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Card className={className}>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-heading font-semibold text-main">{title}</h2>
          {description && <p className="mt-0.5 text-label text-soft">{description}</p>}
        </div>
        {action}
      </div>
      {children}
    </Card>
  );
}

/* ── BreakdownRow ─────────────────────────────────────────────────────────── */

/** Una parte de un total: nombre, valor, porcentaje y barra proporcional. */
export function BreakdownRow({ label, value, pct, color }: {
  label: string;
  value: string;
  /** 0 a 100. */
  pct: number;
  /** Clase de fondo de la barra (ej.: bg-emerald-500). */
  color: string;
}) {
  return (
    <li>
      <div className="flex items-baseline justify-between gap-3 text-body">
        <span className="text-main min-w-0 truncate">{label}</span>
        <span className="shrink-0 tabular-nums">
          <span className="font-semibold text-main">{value}</span>
          <span className="ml-2 inline-block w-10 text-right text-caption text-muted">{Math.round(pct)}%</span>
        </span>
      </div>
      <div className="mt-1.5 h-2 rounded-full bg-surface-3 overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${Math.min(pct, 100)}%` }} />
      </div>
    </li>
  );
}

/** Porcentaje de una parte sobre un total (0 si el total es 0). */
export const share = (part: number, total: number) => (total > 0 ? (part / total) * 100 : 0);

/** Monto con dos decimales, como en el resto de la app. */
export const bs = (n: number) => `Bs ${n.toFixed(2)}`;

/* ── Rank colors ──────────────────────────────────────────────────────────── */

export const RANK_COLORS = [
  'bg-amber-400',
  'bg-slate-400',
  'bg-amber-700',
];

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
        isTop3 ? `${RANK_COLORS[rank - 1]} text-white` : 'bg-surface-2 text-gray-400'
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
        <div className="h-1.5 bg-surface-3 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-[width] duration-700 ease-out ${
              rank === 1 ? 'bg-primary-500' : rank === 2 ? 'bg-primary-400' : rank === 3 ? 'bg-primary-300' : 'bg-line-strong'
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
        isTop3 ? `${RANK_COLORS[rank - 1]} text-white` : 'bg-surface-2 text-gray-400'
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
        <div className="h-1.5 bg-surface-3 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-[width] duration-700 ease-out ${
              rank === 1 ? 'bg-emerald-500' : rank === 2 ? 'bg-emerald-400' : rank === 3 ? 'bg-emerald-300' : 'bg-line-strong'
            }`}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
    </div>
  );
}
