/**
 * Componentes reutilizables del módulo de Reportes.
 */

import type { ReactNode } from 'react';
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

/* ── RankRow ──────────────────────────────────────────────────────────────── */

/**
 * Fila de un ranking (productos, clientes): puesto, nombre con una línea de contexto, la cifra
 * principal a la derecha y una barra relativa al primero.
 */
export function RankRow({ rank, title, detail, value, secondary, pct }: {
  rank: number;
  title: string;
  detail?: string;
  value: string;
  secondary?: string;
  /** 0 a 100, relativo al primero del ranking. */
  pct: number;
}) {
  const first = rank === 1;
  return (
    <li>
      <div className="flex items-center gap-3">
        <span className={`w-7 h-7 shrink-0 rounded-full flex items-center justify-center text-label font-bold ${
          first ? 'bg-primary-500/15 text-primary-700 dark:text-primary-400' : 'bg-surface-2 text-soft border border-line'
        }`}>
          {rank}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-body font-semibold text-main truncate">{title}</p>
          {detail && <p className="text-caption text-muted truncate">{detail}</p>}
        </div>
        <div className="text-right shrink-0">
          <p className="text-body font-semibold text-main tabular-nums">{value}</p>
          {secondary && <p className="text-caption text-muted tabular-nums">{secondary}</p>}
        </div>
      </div>
      <div className="mt-2 ml-10 h-2 rounded-full bg-surface-3 overflow-hidden">
        <div className={`h-full rounded-full ${first ? 'bg-primary-500' : 'bg-line-strong'}`} style={{ width: `${Math.min(pct, 100)}%` }} />
      </div>
    </li>
  );
}
