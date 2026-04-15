import { useState, useEffect } from 'react';
import { PaymentMethod, OrderType } from '@pos/shared';
import type { CreateCustomerRequest } from '@pos/shared';
import { Modal } from '../ui/Modal';
import { CustomerPicker } from './CustomerPicker';
import { useCartStore } from '../../store/cart.store';

export type CustomerPayload = { customerId?: string; createCustomer?: CreateCustomerRequest } | null;
export type PaymentEntry = { method: PaymentMethod; amount: number };

interface Props {
  isOpen: boolean;
  onClose: () => void;
  total: number;
  onConfirm: (payments: PaymentEntry[], customer: CustomerPayload) => Promise<void>;
  onDeferPayment?: (customer: CustomerPayload) => Promise<void>;
}

/* ─── Datos estáticos ────────────────────────────────────────────────────── */

const ORDER_TYPES = [
  {
    value: OrderType.DINE_IN,
    label: 'Local',
    desc: 'Consumir en el local',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
          d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
      </svg>
    ),
    idle:   'border-2 border-gray-200 bg-white text-gray-500 hover:border-primary-300 hover:bg-primary-50/50 hover:text-primary-700',
    active: 'border-2 border-primary-500 bg-primary-50 text-primary-900 ring-2 ring-primary-200 shadow-sm',
  },
  {
    value: OrderType.TAKEOUT,
    label: 'Para Llevar',
    desc: 'El cliente retira',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
          d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
      </svg>
    ),
    idle:   'border-2 border-gray-200 bg-white text-gray-500 hover:border-amber-300 hover:bg-amber-50/50 hover:text-amber-700',
    active: 'border-2 border-amber-500 bg-amber-50 text-amber-900 ring-2 ring-amber-200 shadow-sm',
  },
  {
    value: OrderType.DELIVERY,
    label: 'Delivery',
    desc: 'Entrega a domicilio',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
          d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
      </svg>
    ),
    idle:   'border-2 border-gray-200 bg-white text-gray-500 hover:border-emerald-300 hover:bg-emerald-50/50 hover:text-emerald-700',
    active: 'border-2 border-emerald-500 bg-emerald-50 text-emerald-900 ring-2 ring-emerald-200 shadow-sm',
  },
];

const PAYMENT_METHODS = [
  {
    value: PaymentMethod.CASH,
    label: 'Efectivo',
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
];

const methodMap = Object.fromEntries(PAYMENT_METHODS.map((m) => [m.value, m]));

/* ─── Sub-componente: encabezado de paso ─────────────────────────────────── */

function StepHeader({ n, label, done }: { n: number; label: string; done: boolean }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <div className={[
        'w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-all duration-200',
        done
          ? 'bg-emerald-500 text-white shadow-[0_2px_6px_oklch(0.55_0.18_145/0.30)]'
          : 'bg-gray-100 text-gray-500',
      ].join(' ')}>
        {done ? (
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
        ) : (
          <span className="text-xs font-black">{n}</span>
        )}
      </div>
      <span className={`text-sm font-bold tracking-wide ${done ? 'text-gray-600' : 'text-gray-900'}`}>
        {label}
      </span>
    </div>
  );
}

/* ─── Componente principal ───────────────────────────────────────────────── */

export function PaymentModal({ isOpen, onClose, total, onConfirm, onDeferPayment }: Props) {
  const { setOrderType } = useCartStore();

  // Paso 1 — tipo
  const [selectedType, setSelectedType] = useState<OrderType | null>(null);

  // Paso 2 — cliente
  const [customerConfirmed, setCustomerConfirmed] = useState(false);
  const [customerValue, setCustomerValue]         = useState<CustomerPayload>(null);
  const [pickerKey, setPickerKey]                 = useState(0);

  // Paso 3 — pago
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
  const [splitMode, setSplitMode]           = useState(false);
  const [splitPayments, setSplitPayments]   = useState<PaymentEntry[]>([]);
  const [splitMethod, setSplitMethod]       = useState<PaymentMethod | null>(null);
  const [splitAmount, setSplitAmount]       = useState('');

  const [loading, setLoading] = useState(false);

  /* Split helpers */
  const assigned      = Math.round(splitPayments.reduce((s, p) => s + p.amount, 0) * 100) / 100;
  const remaining     = Math.round((total - assigned) * 100) / 100;
  const splitComplete = Math.abs(remaining) <= 0.01;

  /* Pasos completados */
  const step1Done = selectedType !== null;
  const step2Done = customerConfirmed;
  const step3Done = (!splitMode && selectedMethod !== null) || (splitMode && splitComplete);
  const canConfirm = step1Done && step2Done && step3Done && !loading;

  /* Reset completo al cerrar */
  const resetState = () => {
    setSelectedType(null);
    setCustomerConfirmed(false);
    setCustomerValue(null);
    setPickerKey((k) => k + 1);
    setSelectedMethod(null);
    setSplitMode(false);
    setSplitPayments([]);
    setSplitMethod(null);
    setSplitAmount('');
  };

  // Resetear al abrir (por si se cerró sin confirmar)
  useEffect(() => {
    if (isOpen) resetState();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const handleClose = () => { resetState(); onClose(); };

  /* ── Handlers de cliente ── */
  const handleCustomerChange = (payload: CustomerPayload) => {
    setCustomerValue(payload);
    if (payload !== null) {
      setCustomerConfirmed(true);
    } else {
      // picker cleared → des-confirmar solo si no había "sin cliente" activo
      setCustomerConfirmed(false);
    }
  };

  const handleNoCustomer = () => {
    setCustomerValue(null);
    setCustomerConfirmed(true);
    setPickerKey((k) => k + 1); // resetea el picker internamente
  };

  /* ── Handlers de pago ── */
  const handleAddSplit = () => {
    if (!splitMethod) return;
    const amount = parseFloat(splitAmount);
    if (isNaN(amount) || amount <= 0) return;
    const capped = Math.min(Math.round(amount * 100) / 100, remaining);
    setSplitPayments((prev) => [...prev, { method: splitMethod, amount: capped }]);
    setSplitMethod(null);
    setSplitAmount('');
  };

  const handleRemoveSplit = (i: number) => {
    setSplitPayments((prev) => prev.filter((_, idx) => idx !== i));
  };

  /* ── Confirmar pedido ── */
  const handleConfirm = async () => {
    if (!canConfirm || !selectedType) return;
    setOrderType(selectedType);
    setLoading(true);
    try {
      const payments: PaymentEntry[] = splitMode
        ? splitPayments
        : [{ method: selectedMethod!, amount: total }];
      await onConfirm(payments, customerValue);
      resetState();
    } catch {
      // onConfirm already shows the error toast; just stop loading
    } finally {
      setLoading(false);
    }
  };

  const handleDefer = async () => {
    if (!onDeferPayment || !selectedType) return;
    if (!step1Done || !step2Done) return;
    setOrderType(selectedType);
    setLoading(true);
    try { await onDeferPayment(customerValue); resetState(); } finally { setLoading(false); }
  };

  /* ── Render ── */
  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Nuevo pedido" size="2xl">
      <div className="space-y-7">

        {/* ════════════════════════════════════
            PASO 1 — TIPO DE PEDIDO
        ════════════════════════════════════ */}
        <div>
          <StepHeader n={1} label="Tipo de pedido" done={step1Done} />
          <div className="grid grid-cols-3 gap-3">
            {ORDER_TYPES.map((t) => (
              <button
                key={t.value}
                onClick={() => setSelectedType(t.value)}
                className={[
                  'flex flex-col items-center gap-2 py-4 px-2 rounded-2xl transition-all duration-150 text-center',
                  selectedType === t.value ? t.active : t.idle,
                ].join(' ')}
              >
                {t.icon}
                <span className="text-sm font-bold leading-tight">{t.label}</span>
                <span className="text-[11px] opacity-70 leading-tight hidden sm:block">{t.desc}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="border-t border-gray-100" />

        {/* ════════════════════════════════════
            PASO 2 — CLIENTE
        ════════════════════════════════════ */}
        <div>
          <StepHeader n={2} label="Cliente" done={step2Done} />

          {/* Si ya confirmó "sin cliente", mostrar chip */}
          {customerConfirmed && customerValue === null ? (
            <div className="flex items-center justify-between px-4 py-3 rounded-2xl bg-gray-50 border-2 border-gray-200">
              <div className="flex items-center gap-2 text-sm text-gray-600 font-medium">
                <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Sin cliente
              </div>
              <button
                type="button"
                onClick={() => { setCustomerConfirmed(false); setPickerKey((k) => k + 1); }}
                className="text-xs text-gray-400 hover:text-gray-600 transition-colors px-2 py-1 rounded-lg hover:bg-gray-100"
              >
                Cambiar
              </button>
            </div>
          ) : (
            <div className="space-y-2.5">
              <CustomerPicker key={pickerKey} onCustomerChange={handleCustomerChange} />

              {/* Sin cliente — solo visible si no hay customer seleccionado en el picker */}
              {!customerConfirmed && (
                <button
                  type="button"
                  onClick={handleNoCustomer}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl
                    border-2 border-gray-200 text-sm font-medium text-gray-400
                    hover:border-gray-300 hover:text-gray-600 hover:bg-gray-50 transition-all duration-150"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                  </svg>
                  Sin cliente para este pedido
                </button>
              )}
            </div>
          )}
        </div>

        <div className="border-t border-gray-100" />

        {/* ════════════════════════════════════
            PASO 3 — MÉTODO DE PAGO
        ════════════════════════════════════ */}
        <div>
          <StepHeader n={3} label="Método de pago" done={step3Done} />

          {!splitMode ? (
            <>
              <div className="grid grid-cols-3 gap-3">
                {PAYMENT_METHODS.map((m) => (
                  <button
                    key={m.value}
                    onClick={() => setSelectedMethod(m.value)}
                    className={[
                      'flex flex-col items-center gap-2.5 py-5 px-2 rounded-2xl transition-all duration-150',
                      selectedMethod === m.value ? m.active : m.idle,
                    ].join(' ')}
                  >
                    {m.icon}
                    <span className="text-sm font-semibold">{m.label}</span>
                  </button>
                ))}
              </div>

              <button
                onClick={() => { setSplitMode(true); setSplitAmount(total.toFixed(2)); setSelectedMethod(null); }}
                className="mt-3 w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl
                  text-xs font-medium text-gray-400 hover:text-primary-600 hover:bg-primary-50
                  border-2 border-gray-200 hover:border-primary-200 transition-all"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Dividir pago entre varios métodos
              </button>
            </>
          ) : (
            /* ── Split mode ── */
            <div className="space-y-4">

              {/* Cabecera: título + volver */}
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Dividir pago
                </span>
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

              {/* Barra de progreso */}
              <div>
                <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${Math.min((assigned / total) * 100, 100)}%`,
                      background: splitComplete
                        ? 'oklch(0.55 0.18 145)'
                        : 'oklch(0.75 0.15 85)',
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

              {/* Chips de pagos ya agregados */}
              {splitPayments.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {splitPayments.map((p, i) => {
                    const m = methodMap[p.method];
                    return (
                      <div key={i} className="flex items-center gap-1.5 pl-3 pr-2 py-1.5 rounded-full bg-gray-100 border border-gray-200 text-sm">
                        <span className="font-semibold text-gray-800">{m?.label ?? p.method}</span>
                        <span className="text-gray-500">Bs {p.amount.toFixed(2)}</span>
                        <button
                          onClick={() => handleRemoveSplit(i)}
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

              {/* Formulario para agregar — solo si no está completo */}
              {!splitComplete && (
                <div className="space-y-2.5">
                  {/* Métodos */}
                  <div className="grid grid-cols-3 gap-2">
                    {PAYMENT_METHODS.map((m) => (
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

                  {/* Monto + botón en fila */}
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
                          focus:outline-none focus:ring-0 focus:border-primary-400
                          transition-[border-color]"
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

        {/* ════════════════════════════════════
            FOOTER — TOTAL + CONFIRMAR
        ════════════════════════════════════ */}
        <div className="border-t border-gray-100 pt-5 space-y-3">
          <div className="flex items-baseline justify-between px-1">
            <span className="text-sm font-semibold text-gray-500">Total</span>
            <span className="font-heading font-black text-3xl text-gray-900">
              Bs {total.toFixed(2)}
            </span>
          </div>

          {/* Pasos pendientes — guía visual */}
          {!canConfirm && (
            <div className="flex flex-wrap gap-1.5 px-1">
              {!step1Done && (
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
                  Selecciona tipo de pedido
                </span>
              )}
              {!step2Done && (
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
                  Confirma el cliente
                </span>
              )}
              {!step3Done && (
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
                  Elige método de pago
                </span>
              )}
            </div>
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
            {loading ? 'Procesando…' : canConfirm ? `Confirmar pedido · Bs ${total.toFixed(2)}` : 'Confirmar pedido'}
          </button>

          {onDeferPayment && step1Done && step2Done && (
            <button
              onClick={handleDefer}
              disabled={loading}
              className={[
                'w-full py-4 rounded-2xl text-base font-bold transition-all duration-200 disabled:opacity-50',
                'bg-amber-400 hover:bg-amber-500 text-amber-950 shadow-[0_4px_16px_oklch(0.82_0.17_85/0.35)] active:scale-[0.98]',
              ].join(' ')}
            >
              {loading ? 'Procesando…' : 'Cobrar después · dejar pendiente'}
            </button>
          )}
        </div>
      </div>
    </Modal>
  );
}
