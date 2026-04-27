import { useState } from 'react';
import { PaymentMethod, OrderType } from '@pos/shared';
import type { OrderDto } from '@pos/shared';
import { Modal } from '../ui/Modal';
import { ordersApi } from '../../api/orders.api';
import { handleApiError } from '../../utils/api-error';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  order: OrderDto;
  onPaid: (order: OrderDto) => void;
  allowCortesia?: boolean;
}

type PaymentEntry = { method: PaymentMethod; amount: number };

/* ─── Datos estáticos ────────────────────────────────────────────────────── */

const ORDER_TYPE_LABEL: Record<OrderType, string> = {
  [OrderType.DINE_IN]:  'Local',
  [OrderType.TAKEOUT]:  'Para Llevar',
  [OrderType.DELIVERY]: 'Delivery',
};

const ALL_PAYMENT_METHODS = [
  {
    value: PaymentMethod.CASH,
    label: 'Efectivo',
    cortesiaOnly: false,
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
    idle:        'border-2 border-gray-200 bg-white text-gray-500 hover:border-emerald-300 hover:bg-emerald-50/60 hover:text-emerald-700',
    active:      'border-2 border-emerald-500 bg-emerald-50 text-emerald-900 ring-2 ring-emerald-200 shadow-sm',
    splitIdle:   'border border-gray-200 bg-white text-gray-600 hover:border-emerald-300 hover:bg-emerald-50',
    splitActive: 'border-2 border-emerald-400 bg-emerald-100 text-emerald-800',
  },
  {
    value: PaymentMethod.QR,
    label: 'QR',
    cortesiaOnly: false,
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
      </svg>
    ),
    idle:        'border-2 border-gray-200 bg-white text-gray-500 hover:border-primary-300 hover:bg-primary-50/60 hover:text-primary-700',
    active:      'border-2 border-primary-500 bg-primary-50 text-primary-900 ring-2 ring-primary-200 shadow-sm',
    splitIdle:   'border border-gray-200 bg-white text-gray-600 hover:border-primary-300 hover:bg-primary-50',
    splitActive: 'border-2 border-primary-400 bg-primary-100 text-primary-800',
  },
  {
    value: PaymentMethod.TRANSFER,
    label: 'Transferencia',
    cortesiaOnly: false,
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
      </svg>
    ),
    idle:        'border-2 border-gray-200 bg-white text-gray-500 hover:border-violet-300 hover:bg-violet-50/60 hover:text-violet-700',
    active:      'border-2 border-violet-500 bg-violet-50 text-violet-900 ring-2 ring-violet-200 shadow-sm',
    splitIdle:   'border border-gray-200 bg-white text-gray-600 hover:border-violet-300 hover:bg-violet-50',
    splitActive: 'border-2 border-violet-400 bg-violet-100 text-violet-800',
  },
  {
    value: PaymentMethod.CORTESIA,
    label: 'Cortesía',
    cortesiaOnly: true,
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
      </svg>
    ),
    idle:        'border-2 border-gray-200 bg-white text-gray-500 hover:border-amber-300 hover:bg-amber-50/60 hover:text-amber-700',
    active:      'border-2 border-amber-500 bg-amber-50 text-amber-900 ring-2 ring-amber-200 shadow-sm',
    splitIdle:   'border border-gray-200 bg-white text-gray-600 hover:border-amber-300 hover:bg-amber-50',
    splitActive: 'border-2 border-amber-400 bg-amber-100 text-amber-800',
  },
];

/* ─── Componente ─────────────────────────────────────────────────────────── */

export function PayOrderModal({ isOpen, onClose, order, onPaid, allowCortesia = false }: Props) {
  const total = order.total;

  const PAYMENT_METHODS = ALL_PAYMENT_METHODS.filter((m) => !m.cortesiaOnly || allowCortesia);
  // Cortesía es todo-o-nada — no aplica en split
  const SPLIT_METHODS = PAYMENT_METHODS.filter((m) => m.value !== PaymentMethod.CORTESIA);

  const methodMap = Object.fromEntries(PAYMENT_METHODS.map((m) => [m.value, m]));

  const [loading, setLoading]               = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
  const [splitMode, setSplitMode]           = useState(false);
  const [splitPayments, setSplitPayments]   = useState<PaymentEntry[]>([]);
  const [splitMethod, setSplitMethod]       = useState<PaymentMethod | null>(null);
  const [splitAmount, setSplitAmount]       = useState('');

  const assigned      = Math.round(splitPayments.reduce((s, p) => s + p.amount, 0) * 100) / 100;
  const remaining     = Math.round((total - assigned) * 100) / 100;
  const splitComplete = Math.abs(remaining) <= 0.01;

  const step3Done  = (!splitMode && selectedMethod !== null) || (splitMode && splitComplete);
  const canConfirm = step3Done && !loading;

  const resetState = () => {
    setSelectedMethod(null);
    setSplitMode(false);
    setSplitPayments([]);
    setSplitMethod(null);
    setSplitAmount('');
  };

  const handleClose = () => { resetState(); onClose(); };

  const submitPayments = async (payments: PaymentEntry[]) => {
    setLoading(true);
    try {
      const updated = await ordersApi.registerPayments(
        order.id,
        payments.map((p) => ({ method: p.method, amount: p.amount })),
      );
      resetState();
      onPaid(updated);
    } catch (err) {
      handleApiError(err, 'Error al registrar cobro');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = () => {
    if (!canConfirm) return;
    if (splitMode) {
      submitPayments(splitPayments);
    } else if (selectedMethod) {
      submitPayments([{ method: selectedMethod, amount: total }]);
    }
  };

  const handleAddSplit = () => {
    if (!splitMethod) return;
    const amount = parseFloat(splitAmount);
    if (isNaN(amount) || amount <= 0) return;
    const capped = Math.min(Math.round(amount * 100) / 100, remaining);
    setSplitPayments((prev) => [...prev, { method: splitMethod, amount: capped }]);
    setSplitMethod(null);
    setSplitAmount('');
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Registrar cobro" size="full">
      <div className="space-y-6">

        {/* ── Resumen del pedido ─────────────────────────────────────── */}
        <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-gray-50 border border-gray-100">
          <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
            <span className="text-sm font-black text-amber-700">#{order.orderNumber}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-gray-900">
              {ORDER_TYPE_LABEL[order.type]}
              {order.customer?.name && (
                <span className="font-normal text-gray-500"> · {order.customer.name}</span>
              )}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">
              {order.items.length} ítem{order.items.length !== 1 ? 's' : ''}
              {order.notes && <span> · {order.notes}</span>}
            </p>
          </div>
          <span className="font-heading font-black text-xl text-gray-900 shrink-0">
            Bs {Number(total).toFixed(2)}
          </span>
        </div>

        <div className="border-t border-gray-100" />

        {/* ── Método de pago ─────────────────────────────────────────── */}
        <div>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">
            Método de pago
          </p>

          {!splitMode ? (
            <>
              <div className={`grid gap-3 ${PAYMENT_METHODS.length === 4 ? 'grid-cols-2' : 'grid-cols-3'}`}>
                {PAYMENT_METHODS.map((m) => (
                  <button
                    key={m.value}
                    onClick={() => setSelectedMethod(m.value)}
                    disabled={loading}
                    className={[
                      'flex flex-col items-center gap-2.5 py-5 px-2 rounded-2xl transition-all duration-150 disabled:opacity-50',
                      selectedMethod === m.value ? m.active : m.idle,
                    ].join(' ')}
                  >
                    {m.icon}
                    <span className="text-sm font-semibold">{m.label}</span>
                  </button>
                ))}
              </div>

              {selectedMethod !== PaymentMethod.CORTESIA && (
                <button
                  onClick={() => { setSplitMode(true); setSplitAmount(total.toFixed(2)); setSelectedMethod(null); }}
                  className="mt-3 w-full flex items-center justify-center gap-1.5 py-3 rounded-2xl
                    text-sm font-medium text-gray-400 hover:text-primary-600 hover:bg-primary-50
                    border-2 border-gray-200 hover:border-primary-200 transition-all"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Dividir pago entre varios métodos
                </button>
              )}
            </>
          ) : (
            /* ── Split mode ── */
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Dividir pago</span>
                <button
                  onClick={() => { setSplitMode(false); setSplitPayments([]); setSplitMethod(null); setSplitAmount(''); }}
                  className="text-xs text-gray-400 hover:text-primary-600 transition-colors flex items-center gap-1"
                >
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Pago simple
                </button>
              </div>

              <div>
                <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${Math.min((assigned / total) * 100, 100)}%`,
                      background: splitComplete ? 'oklch(0.55 0.18 145)' : 'oklch(0.75 0.15 85)',
                    }}
                  />
                </div>
                <div className="flex justify-between mt-1.5 text-xs">
                  <span className="text-gray-400">
                    Asignado <span className="font-semibold text-gray-700">Bs {assigned.toFixed(2)}</span>
                  </span>
                  <span className={splitComplete ? 'text-emerald-600 font-bold' : 'text-amber-600 font-semibold'}>
                    {splitComplete ? '¡Completo!' : `Restante Bs ${remaining.toFixed(2)}`}
                  </span>
                </div>
              </div>

              {splitPayments.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {splitPayments.map((p, i) => {
                    const m = methodMap[p.method];
                    return (
                      <div key={i} className="flex items-center gap-1.5 pl-3 pr-2 py-1.5 rounded-full bg-gray-100 border border-gray-200 text-sm">
                        <span className="font-semibold text-gray-800">{m?.label ?? p.method}</span>
                        <span className="text-gray-500">Bs {p.amount.toFixed(2)}</span>
                        <button
                          onClick={() => setSplitPayments((prev) => prev.filter((_, idx) => idx !== i))}
                          className="w-4 h-4 rounded-full bg-gray-300 hover:bg-red-400 flex items-center justify-center text-white transition-colors ml-0.5"
                          aria-label="Quitar"
                        >
                          <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}

              {!splitComplete && (
                <div className="space-y-2.5">
                  <div className="grid grid-cols-3 gap-2">
                    {SPLIT_METHODS.map((m) => (
                      <button
                        key={m.value}
                        onClick={() => setSplitMethod(m.value)}
                        className={[
                          'py-2.5 rounded-xl text-sm font-semibold transition-all',
                          splitMethod === m.value ? m.splitActive : m.splitIdle,
                        ].join(' ')}
                      >
                        {m.label}
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-gray-400">Bs</span>
                      <input
                        type="number"
                        min="0.01"
                        step="0.01"
                        value={splitAmount}
                        onChange={(e) => setSplitAmount(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAddSplit()}
                        placeholder={remaining.toFixed(2)}
                        className="w-full pl-10 pr-3 py-2.5 text-sm border-2 border-gray-200 rounded-xl bg-white
                          focus:outline-none focus:border-primary-400 transition-[border-color]"
                      />
                    </div>
                    <button
                      onClick={handleAddSplit}
                      disabled={!splitMethod || !splitAmount || parseFloat(splitAmount) <= 0}
                      className="px-5 py-2.5 rounded-xl text-sm font-bold bg-primary-600 text-white
                        hover:bg-primary-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                      + Agregar
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Footer: confirmar ──────────────────────────────────────── */}
        <div className="border-t border-gray-100 pt-5 space-y-3">
          {!canConfirm && (
            <p className="text-[11px] px-1 text-gray-400">
              Selecciona un método de pago para continuar
            </p>
          )}

          <button
            onClick={handleConfirm}
            disabled={!canConfirm}
            className={[
              'w-full py-4 rounded-2xl text-base font-bold transition-all duration-200',
              canConfirm
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-[0_4px_16px_oklch(0.55_0.18_145/0.30)] active:scale-[0.98]'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed',
            ].join(' ')}
          >
            {loading
              ? 'Procesando…'
              : canConfirm
                ? `Confirmar cobro · Bs ${Number(total).toFixed(2)}`
                : 'Confirmar cobro'}
          </button>
        </div>

      </div>
    </Modal>
  );
}
