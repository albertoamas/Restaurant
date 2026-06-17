import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { OrderStatus, OrderType } from '@pos/shared';
import type { OrderDto } from '@pos/shared';
import { useAuth } from '../context/auth.context';
import { useKitchenOrders } from '../hooks/useKitchenOrders';
import { elapsed } from '../utils/date';
import { orderTypeLabels } from '../utils/order';
import { Icon } from '../components/ui/Icon';

const typeColors: Record<OrderType, string> = {
  [OrderType.DINE_IN]: 'bg-primary-500/10 text-primary-600 border border-primary-500/20',
  [OrderType.TAKEOUT]: 'bg-amber-500/12 text-amber-600 border border-amber-500/25',
  [OrderType.DELIVERY]: 'bg-violet-500/12 text-violet-600 border border-violet-500/25',
};

function getElapsedMinutes(createdAt: string): number {
  return Math.floor((Date.now() - new Date(createdAt).getTime()) / 60_000);
}

function timerPill(minutes: number): string {
  if (minutes >= 10) return 'bg-red-50 text-red-700 border border-red-200';
  if (minutes >= 5) return 'bg-amber-50 text-amber-700 border border-amber-200';
  return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
}

function KitchenClock() {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1_000);
    return () => clearInterval(id);
  }, []);
  return (
    <span className="font-heading font-bold text-sm text-gray-500 tabular-nums">
      {time.toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
    </span>
  );
}

interface KitchenCardProps {
  order: OrderDto;
  onAction: (id: string, status: OrderStatus) => void;
  actionLabel: string;
  actionStatus: OrderStatus;
  actionColor: string;
  actionAriaLabel: string;
}

function KitchenCard({ order, onAction, actionLabel, actionStatus, actionColor, actionAriaLabel }: KitchenCardProps) {
  const minutes = getElapsedMinutes(order.createdAt);

  return (
    <div className="rounded-2xl overflow-hidden flex flex-col animate-slide border border-[var(--border-subtle)] shadow-card-md" style={{ background: 'var(--color-surface-card)' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 sm:px-5 py-4 border-b border-[var(--border-subtle)] bg-[var(--color-surface-2)]">
        <div>
          <p className="text-[10px] uppercase tracking-[0.14em] text-gray-400 font-semibold mb-1">Orden</p>
          <span className="font-heading font-black text-4xl sm:text-5xl text-gray-900 tracking-tight leading-none">
            #{order.orderNumber}
          </span>
        </div>
        <div className="flex flex-col items-end gap-2.5">
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${typeColors[order.type]}`}>
            {orderTypeLabels[order.type]}
          </span>
          <span className={`px-2.5 py-1 rounded-full text-xs tabular-nums font-bold ${timerPill(minutes)}`}>
            {elapsed(order.createdAt)}
          </span>
        </div>
      </div>

      {/* Items */}
      <div className="flex-1 px-5 py-4 space-y-2.5">
        {order.items.map((item) => (
          <div key={item.id} className="flex items-baseline gap-3 rounded-xl px-3 py-2 bg-[var(--color-surface-2)] border border-[var(--border-subtle)]">
            <span className="font-heading font-black text-2xl sm:text-3xl text-gray-500 w-10 shrink-0 tabular-nums">
              {item.quantity}×
            </span>
            <span className="text-lg sm:text-xl font-bold text-gray-900 leading-tight">{item.productName}</span>
          </div>
        ))}

        {order.notes && (
          <div className="mt-3 rounded-xl px-4 py-3 border bg-amber-50 border-amber-100">
            <p className="text-xs font-bold text-amber-600 uppercase tracking-wide mb-1">Nota</p>
            <p className="text-base text-amber-800 leading-snug">{order.notes}</p>
          </div>
        )}
      </div>

      {/* Action */}
      <div className="px-4 pb-4 pt-2">
        <button
          onClick={() => onAction(order.id, actionStatus)}
          className={`w-full py-4 rounded-xl text-white font-black text-lg border transition-all duration-150 active:brightness-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/45 focus-visible:ring-offset-2 ${actionColor}`}
          aria-label={actionAriaLabel}
        >
          {actionLabel}
        </button>
      </div>
    </div>
  );
}

export function KitchenPage() {
  const [, setTick] = useState(0);
  const { currentBranchId } = useAuth();
  const { pending, preparing, updateStatus, refresh } = useKitchenOrders(currentBranchId);

  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 1_000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden bg-[var(--color-surface-page)]">
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: [
            'radial-gradient(1200px 540px at 0% 0%, oklch(0.55 0.20 42 / 0.12), transparent 62%)',
            'radial-gradient(1200px 540px at 100% 0%, oklch(0.48 0.18 38 / 0.10), transparent 64%)',
          ].join(','),
        }}
      />

      {/* Kitchen header */}
      <div className="relative z-10 px-4 sm:px-6 py-4 flex items-center justify-between border-b border-[var(--border-subtle)] shrink-0 shadow-card-md" style={{ background: 'var(--color-surface-card)' }}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/25 flex items-center justify-center shadow-[inset_0_1px_0_oklch(1_0_0/0.10)]">
            <Icon name="flame" size={16} className="text-amber-400" />
          </div>
          <div>
            <h1 className="font-heading font-black text-gray-900 text-lg tracking-tight">Panel de Cocina</h1>
            <p className="text-xs text-gray-500 font-medium">Flujo en tiempo real por estado</p>
          </div>
        </div>

        <div className="flex items-center gap-3 sm:gap-6">
          <KitchenClock />
          <div className="hidden sm:flex items-center gap-3 text-sm">
            <span className="flex items-center gap-1.5 text-amber-400 font-semibold">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              {pending.length} pendientes
            </span>
            <span className="text-gray-500">·</span>
            <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              {preparing.length} preparando
            </span>
          </div>
          <button
            onClick={refresh}
            className="w-9 h-9 flex items-center justify-center rounded-xl text-gray-500 hover:text-gray-600 hover:bg-[var(--color-surface-2)] transition-colors border border-[var(--border-subtle)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/45 focus-visible:ring-offset-2"
            title="Actualizar"
            aria-label="Actualizar pedidos de cocina"
          >
            <Icon name="refresh" size={16} />
          </button>
          <Link
            to="/pos"
            className="h-9 px-3 inline-flex items-center gap-1.5 rounded-xl text-xs sm:text-sm font-semibold text-gray-500 bg-[var(--color-surface-2)] border border-[var(--border-subtle)] hover:border-primary-500/40 hover:text-primary-400 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/45 focus-visible:ring-offset-2"
            aria-label="Volver al panel principal"
          >
            <Icon name="arrow-left" size={14} />
            Volver al panel
          </Link>
        </div>
      </div>

      <div className="relative z-10 sm:hidden px-4 pb-3 border-b border-[var(--border-subtle)] bg-[var(--color-surface-2)]">
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="rounded-xl px-3 py-2 bg-amber-500/10 border border-amber-500/20">
            <p className="text-amber-400 font-black uppercase tracking-[0.08em]">Pendientes</p>
            <p className="text-gray-900 font-heading font-black text-lg leading-tight mt-0.5">{pending.length}</p>
          </div>
          <div className="rounded-xl px-3 py-2 bg-emerald-500/10 border border-emerald-500/20">
            <p className="text-emerald-400 font-black uppercase tracking-[0.08em]">Preparando</p>
            <p className="text-gray-900 font-heading font-black text-lg leading-tight mt-0.5">{preparing.length}</p>
          </div>
        </div>
      </div>

      {/* Two-column board */}
      <div className="relative z-10 flex-1 grid grid-cols-1 xl:grid-cols-2 gap-4 p-4 sm:p-6 min-h-0">
        {/* PENDING column */}
        <div className="flex flex-col min-h-0 rounded-2xl border border-[var(--border-subtle)] shadow-card-xl overflow-hidden" style={{ background: 'var(--color-surface-card)' }}>
          <div className="px-5 py-3 flex items-center gap-2.5 border-b border-amber-500/20 bg-amber-500/[0.08] sticky top-0 z-10 backdrop-blur-sm">
            <span className="text-amber-400 font-black text-xs uppercase tracking-[0.12em]">Pendientes</span>
            <span
              className={[
                'text-xs font-black rounded-full w-5 h-5 flex items-center justify-center tabular-nums transition-colors',
                pending.length > 0
                  ? 'bg-amber-500 text-white'
                  : 'bg-[var(--color-surface-2)] text-gray-400 border border-[var(--border-subtle)]',
              ].join(' ')}
              aria-label={`Pedidos pendientes: ${pending.length}`}
            >
              {pending.length}
            </span>
          </div>
          <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 sm:space-y-4">
            {pending.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 gap-2 text-gray-300">
                <Icon name="orders" size={40} strokeWidth={1.5} className="opacity-60" />
                <p className="text-sm">Sin pedidos pendientes</p>
              </div>
            ) : (
              pending.map((order) => (
                <KitchenCard
                  key={order.id}
                  order={order}
                  actionLabel="▶  Iniciar preparación"
                  actionStatus={OrderStatus.PREPARING}
                  actionColor="bg-amber-500 hover:bg-amber-600 border-amber-500 shadow-[0_3px_10px_oklch(0.72_0.16_85/0.22)]"
                  actionAriaLabel={`Iniciar preparación de la orden ${order.orderNumber}`}
                  onAction={updateStatus}
                />
              ))
            )}
          </div>
        </div>

        {/* PREPARING column */}
        <div className="flex flex-col min-h-0 rounded-2xl border border-[var(--border-subtle)] shadow-card-xl overflow-hidden" style={{ background: 'var(--color-surface-card)' }}>
          <div className="px-5 py-3 flex items-center gap-2.5 border-b border-emerald-500/20 bg-emerald-500/[0.08] sticky top-0 z-10 backdrop-blur-sm">
            <span className="text-emerald-400 font-black text-xs uppercase tracking-[0.12em]">Preparando</span>
            <span
              className={[
                'text-xs font-black rounded-full w-5 h-5 flex items-center justify-center tabular-nums transition-colors',
                preparing.length > 0
                  ? 'bg-emerald-500 text-white'
                  : 'bg-[var(--color-surface-2)] text-gray-400 border border-[var(--border-subtle)]',
              ].join(' ')}
              aria-label={`Pedidos preparando: ${preparing.length}`}
            >
              {preparing.length}
            </span>
          </div>
          <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 sm:space-y-4">
            {preparing.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 gap-2 text-gray-300">
                <Icon name="clock" size={40} strokeWidth={1.5} className="opacity-60" />
                <p className="text-sm">Nada en preparación</p>
              </div>
            ) : (
              preparing.map((order) => (
                <KitchenCard
                  key={order.id}
                  order={order}
                  actionLabel="✓  Listo — Entregar"
                  actionStatus={OrderStatus.DELIVERED}
                  actionColor="bg-emerald-600 hover:bg-emerald-700 border-emerald-600 shadow-[0_3px_10px_oklch(0.62_0.18_148/0.22)]"
                  actionAriaLabel={`Marcar como lista y entregar la orden ${order.orderNumber}`}
                  onAction={updateStatus}
                />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
