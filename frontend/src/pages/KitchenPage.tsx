import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { OrderStatus, OrderType } from '@pos/shared';
import type { OrderDto } from '@pos/shared';
import { useAuth } from '../context/auth.context';
import { useKitchenOrders } from '../hooks/useKitchenOrders';
import { elapsed } from '../utils/date';
import { orderTypeLabels } from '../utils/order';

const typeColors: Record<OrderType, string> = {
  [OrderType.DINE_IN]: 'bg-primary-50 text-primary-800 border border-primary-200',
  [OrderType.TAKEOUT]: 'bg-amber-50 text-amber-800 border border-amber-200',
  [OrderType.DELIVERY]: 'bg-violet-50 text-violet-800 border border-violet-200',
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
    <div className="rounded-2xl overflow-hidden flex flex-col animate-slide border border-gray-200 bg-white shadow-[0_8px_22px_oklch(0.13_0.012_260/0.10)]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 sm:px-5 py-4 border-b border-gray-100 bg-[linear-gradient(180deg,oklch(0.995_0.003_250),oklch(1_0_0))]">
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
          <div key={item.id} className="flex items-baseline gap-3 rounded-xl px-3 py-2 bg-gray-50 border border-gray-100">
            <span className="font-heading font-black text-2xl sm:text-3xl text-gray-500 w-10 shrink-0 tabular-nums">
              {item.quantity}×
            </span>
            <span className="text-lg sm:text-xl font-bold text-gray-900 leading-tight">{item.productName}</span>
          </div>
        ))}

        {order.notes && (
          <div className="mt-3 rounded-xl px-4 py-3 border bg-amber-50 border-amber-200">
            <p className="text-xs font-bold text-amber-700 uppercase tracking-wide mb-1">Nota</p>
            <p className="text-base text-amber-900/90 leading-snug">{order.notes}</p>
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
    <div className="min-h-screen flex flex-col relative overflow-hidden bg-[oklch(0.972_0.006_252)]">
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: [
            'radial-gradient(1200px 540px at 0% 0%, oklch(0.74 0.15 85 / 0.16), transparent 62%)',
            'radial-gradient(1200px 540px at 100% 0%, oklch(0.58 0.16 232 / 0.12), transparent 64%)',
            'linear-gradient(180deg, oklch(0.99 0.004 250), oklch(0.965 0.008 252))',
          ].join(','),
        }}
      />

      {/* Kitchen header */}
      <div className="relative z-10 px-4 sm:px-6 py-4 flex items-center justify-between border-b border-white/70 shrink-0 bg-white/70 backdrop-blur-xl shadow-[0_8px_24px_oklch(0.13_0.012_260/0.08)]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-100 border border-amber-200 flex items-center justify-center shadow-[inset_0_1px_0_oklch(1_0_0/0.25)]">
            <svg className="w-4 h-4 text-amber-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z" />
            </svg>
          </div>
          <div>
            <h1 className="font-heading font-black text-gray-900 text-lg tracking-tight">Panel de Cocina</h1>
            <p className="text-xs text-gray-500 font-medium">Flujo en tiempo real por estado</p>
          </div>
        </div>

        <div className="flex items-center gap-3 sm:gap-6">
          <KitchenClock />
          <div className="hidden sm:flex items-center gap-3 text-sm">
            <span className="flex items-center gap-1.5 text-amber-700 font-semibold">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              {pending.length} pendientes
            </span>
            <span className="text-gray-300">·</span>
            <span className="flex items-center gap-1.5 text-emerald-700 font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              {preparing.length} preparando
            </span>
          </div>
          <button
            onClick={refresh}
            className="w-9 h-9 flex items-center justify-center rounded-xl text-gray-500 hover:text-gray-900 hover:bg-white transition-colors border border-gray-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/45 focus-visible:ring-offset-2"
            title="Actualizar"
            aria-label="Actualizar pedidos de cocina"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
          <Link
            to="/pos"
            className="h-9 px-3 inline-flex items-center gap-1.5 rounded-xl text-xs sm:text-sm font-semibold text-gray-700 bg-white border border-gray-200 hover:border-primary-300 hover:text-primary-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/45 focus-visible:ring-offset-2"
            aria-label="Volver al panel principal"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Volver al panel
          </Link>
        </div>
      </div>

      <div className="relative z-10 sm:hidden px-4 pb-3 border-b border-white/70 bg-white/65 backdrop-blur-xl">
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="rounded-xl px-3 py-2 bg-amber-50 border border-amber-200">
            <p className="text-amber-700 font-black uppercase tracking-[0.08em]">Pendientes</p>
            <p className="text-gray-900 font-heading font-black text-lg leading-tight mt-0.5">{pending.length}</p>
          </div>
          <div className="rounded-xl px-3 py-2 bg-emerald-50 border border-emerald-200">
            <p className="text-emerald-700 font-black uppercase tracking-[0.08em]">Preparando</p>
            <p className="text-gray-900 font-heading font-black text-lg leading-tight mt-0.5">{preparing.length}</p>
          </div>
        </div>
      </div>

      {/* Two-column board */}
      <div className="relative z-10 flex-1 grid grid-cols-1 xl:grid-cols-2 gap-4 p-4 sm:p-6 min-h-0">
        {/* PENDING column */}
        <div className="flex flex-col min-h-0 rounded-2xl border border-white/70 bg-white/80 backdrop-blur-xl shadow-[0_10px_28px_oklch(0.13_0.012_260/0.10)] overflow-hidden">
          <div className="px-5 py-3 flex items-center gap-2.5 border-b border-amber-200 bg-amber-50/80 sticky top-0 z-10 backdrop-blur-sm">
            <span className="text-amber-700 font-black text-xs uppercase tracking-[0.12em]">Pendientes</span>
            <span
              className={[
                'text-xs font-black rounded-full w-5 h-5 flex items-center justify-center tabular-nums transition-colors',
                pending.length > 0
                  ? 'bg-amber-500 text-white'
                  : 'bg-white text-gray-500 border border-gray-200',
              ].join(' ')}
              aria-label={`Pedidos pendientes: ${pending.length}`}
            >
              {pending.length}
            </span>
          </div>
          <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 sm:space-y-4">
            {pending.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 gap-2 text-gray-300">
                <svg className="w-10 h-10 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
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
        <div className="flex flex-col min-h-0 rounded-2xl border border-white/70 bg-white/80 backdrop-blur-xl shadow-[0_10px_28px_oklch(0.13_0.012_260/0.10)] overflow-hidden">
          <div className="px-5 py-3 flex items-center gap-2.5 border-b border-emerald-200 bg-emerald-50/80 sticky top-0 z-10 backdrop-blur-sm">
            <span className="text-emerald-700 font-black text-xs uppercase tracking-[0.12em]">Preparando</span>
            <span
              className={[
                'text-xs font-black rounded-full w-5 h-5 flex items-center justify-center tabular-nums transition-colors',
                preparing.length > 0
                  ? 'bg-emerald-500 text-white'
                  : 'bg-white text-gray-500 border border-gray-200',
              ].join(' ')}
              aria-label={`Pedidos preparando: ${preparing.length}`}
            >
              {preparing.length}
            </span>
          </div>
          <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 sm:space-y-4">
            {preparing.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 gap-2 text-gray-300">
                <svg className="w-10 h-10 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
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
