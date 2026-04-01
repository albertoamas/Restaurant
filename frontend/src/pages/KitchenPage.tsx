import { useState, useEffect } from 'react';
import { OrderStatus, OrderType } from '@pos/shared';
import type { OrderDto } from '@pos/shared';
import { useAuth } from '../context/auth.context';
import { useKitchenOrders } from '../hooks/useKitchenOrders';
import { elapsed } from '../utils/date';
import { orderTypeLabels } from '../utils/order';

const typeColors: Record<OrderType, string> = {
  [OrderType.DINE_IN]: 'bg-primary-900/60 text-primary-300 border border-primary-700/50',
  [OrderType.TAKEOUT]: 'bg-amber-900/60 text-amber-300 border border-amber-700/50',
  [OrderType.DELIVERY]: 'bg-violet-900/60 text-violet-300 border border-violet-700/50',
};

function getElapsedMinutes(createdAt: string): number {
  return Math.floor((Date.now() - new Date(createdAt).getTime()) / 60_000);
}

function timerColor(minutes: number): string {
  if (minutes >= 10) return 'text-red-400 font-bold';
  if (minutes >= 5) return 'text-amber-400 font-semibold';
  return 'text-emerald-400 font-medium';
}

function KitchenClock() {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1_000);
    return () => clearInterval(id);
  }, []);
  return (
    <span className="font-heading font-bold text-sm text-white/60 tabular-nums">
      {time.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
    </span>
  );
}

interface KitchenCardProps {
  order: OrderDto;
  onAction: (id: string, status: OrderStatus) => void;
  actionLabel: string;
  actionStatus: OrderStatus;
  actionColor: string;
}

function KitchenCard({ order, onAction, actionLabel, actionStatus, actionColor }: KitchenCardProps) {
  const minutes = getElapsedMinutes(order.createdAt);

  return (
    <div
      className="rounded-2xl overflow-hidden flex flex-col animate-slide border border-white/8"
      style={{ background: 'oklch(0.17 0.016 255)' }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-5 py-4 border-b"
        style={{ borderColor: 'oklch(1 0 0 / 0.06)' }}
      >
        <span className="font-heading font-black text-5xl text-white tracking-tight leading-none">
          #{order.orderNumber}
        </span>
        <div className="flex flex-col items-end gap-2">
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${typeColors[order.type]}`}>
            {orderTypeLabels[order.type]}
          </span>
          <span className={`font-heading font-bold text-xl tabular-nums ${timerColor(minutes)}`}>
            {elapsed(order.createdAt)}
          </span>
        </div>
      </div>

      {/* Items */}
      <div className="flex-1 px-5 py-4 space-y-2.5">
        {order.items.map((item) => (
          <div key={item.id} className="flex items-baseline gap-3">
            <span className="font-heading font-black text-3xl text-white/60 w-10 shrink-0 tabular-nums">
              {item.quantity}×
            </span>
            <span className="text-2xl font-bold text-white/90 leading-tight">{item.productName}</span>
          </div>
        ))}

        {order.notes && (
          <div
            className="mt-3 rounded-xl px-4 py-3 border"
            style={{ background: 'oklch(0.72 0.18 75 / 0.12)', borderColor: 'oklch(0.72 0.18 75 / 0.30)' }}
          >
            <p className="text-xs font-bold text-amber-400 uppercase tracking-wide mb-1">Nota</p>
            <p className="text-base text-amber-200/90 leading-snug">{order.notes}</p>
          </div>
        )}
      </div>

      {/* Action */}
      <div className="px-4 pb-4 pt-2">
        <button
          onClick={() => onAction(order.id, actionStatus)}
          className={`w-full py-4 rounded-xl text-white font-black text-lg
            transition-all active:scale-[0.97] ${actionColor}`}
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
    <div
      className="min-h-screen flex flex-col"
      style={{ background: 'oklch(0.10 0.010 255)' }}
    >
      {/* Kitchen header */}
      <div
        className="px-6 py-4 flex items-center justify-between border-b shrink-0"
        style={{ background: 'oklch(0.08 0.010 255)', borderColor: 'oklch(1 0 0 / 0.06)' }}
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-orange-500/20 border border-orange-500/30 flex items-center justify-center">
            <svg className="w-4 h-4 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z" />
            </svg>
          </div>
          <h1 className="font-heading font-bold text-white text-base tracking-wide">Panel de Cocina</h1>
        </div>

        <div className="flex items-center gap-6">
          <KitchenClock />
          <div className="flex items-center gap-3 text-sm">
            <span className="flex items-center gap-1.5 text-amber-400 font-semibold">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              {pending.length} pendientes
            </span>
            <span className="text-white/20">·</span>
            <span className="flex items-center gap-1.5 text-primary-400 font-semibold">
              <span className="w-2 h-2 rounded-full bg-primary-400" />
              {preparing.length} preparando
            </span>
          </div>
          <button
            onClick={refresh}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-white/40 hover:text-white hover:bg-white/8 transition-colors"
            title="Actualizar"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
      </div>

      {/* Two-column board */}
      <div
        className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-0 min-h-0"
        style={{ borderColor: 'oklch(1 0 0 / 0.06)' }}
      >
        {/* PENDING column */}
        <div className="flex flex-col border-r" style={{ borderColor: 'oklch(1 0 0 / 0.08)' }}>
          <div
            className="px-5 py-3 flex items-center gap-2.5 border-b"
            style={{ background: 'oklch(0.72 0.18 75 / 0.15)', borderColor: 'oklch(0.72 0.18 75 / 0.20)' }}
          >
            <span className="text-amber-400 font-black text-xs uppercase tracking-[0.12em]">Pendientes</span>
            {pending.length > 0 && (
              <span className="bg-amber-400 text-gray-900 text-xs font-black rounded-full w-5 h-5 flex items-center justify-center">
                {pending.length}
              </span>
            )}
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {pending.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 gap-2" style={{ color: 'oklch(1 0 0 / 0.20)' }}>
                <svg className="w-10 h-10 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
                  actionColor="bg-amber-500 hover:bg-amber-600"
                  onAction={updateStatus}
                />
              ))
            )}
          </div>
        </div>

        {/* PREPARING column */}
        <div className="flex flex-col">
          <div
            className="px-5 py-3 flex items-center gap-2.5 border-b"
            style={{ background: 'oklch(0.50 0.24 225 / 0.15)', borderColor: 'oklch(0.50 0.24 225 / 0.20)' }}
          >
            <span className="text-primary-400 font-black text-xs uppercase tracking-[0.12em]">Preparando</span>
            {preparing.length > 0 && (
              <span className="bg-primary-400 text-gray-900 text-xs font-black rounded-full w-5 h-5 flex items-center justify-center">
                {preparing.length}
              </span>
            )}
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {preparing.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 gap-2" style={{ color: 'oklch(1 0 0 / 0.20)' }}>
                <svg className="w-10 h-10 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
                  actionColor="bg-gradient-to-b from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700"
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
