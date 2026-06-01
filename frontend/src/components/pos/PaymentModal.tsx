import { useState, useEffect } from 'react';
import { PaymentMethod, OrderType } from '@pos/shared';
import type { CreateCustomerRequest } from '@pos/shared';
import { Modal } from '../ui/Modal';
import { Icon } from '../ui/Icon';
import { CustomerPicker } from './CustomerPicker';
import { useCartStore } from '../../store/cart.store';

export type CustomerPayload = { customerId?: string; createCustomer?: CreateCustomerRequest } | null;
export type PaymentEntry = { method: PaymentMethod; amount: number };

interface Props {
  isOpen: boolean;
  onClose: () => void;
  total: number;
  onConfirm: (payments: PaymentEntry[], customer: CustomerPayload, orderType: OrderType) => Promise<void>;
  onDeferPayment?: (customer: CustomerPayload, orderType: OrderType) => Promise<void>;
  allowCortesia?: boolean;
}

/* ─── Datos estáticos ────────────────────────────────────────────────────── */

const ORDER_TYPES = [
  {
    value: OrderType.DINE_IN,
    label: 'Local',
    desc: 'Consumir en el local',
    icon: <Icon name="card" size={24} />,
    idle:   'border-2 border-white/12 bg-white/5 text-gray-500 hover:border-primary-400/50 hover:bg-primary-500/10 hover:text-primary-400',
    active: 'border-2 border-primary-500/70 bg-primary-500/18 text-primary-300',
  },
  {
    value: OrderType.TAKEOUT,
    label: 'Para Llevar',
    desc: 'El cliente retira',
    icon: <Icon name="bag" size={24} />,
    idle:   'border-2 border-white/12 bg-white/5 text-gray-500 hover:border-amber-400/50 hover:bg-amber-500/10 hover:text-amber-400',
    active: 'border-2 border-amber-500/70 bg-amber-500/18 text-amber-300',
  },
  {
    value: OrderType.DELIVERY,
    label: 'Delivery',
    desc: 'Entrega a domicilio',
    icon: <Icon name="map" size={24} />,
    idle:   'border-2 border-white/12 bg-white/5 text-gray-500 hover:border-emerald-400/50 hover:bg-emerald-500/10 hover:text-emerald-400',
    active: 'border-2 border-emerald-500/70 bg-emerald-500/18 text-emerald-300',
  },
];

const BASE_PAYMENT_METHODS = [
  {
    value: PaymentMethod.CASH,
    label: 'Efectivo',
    cortesiaOnly: false,
    icon: <Icon name="cash" size={28} strokeWidth={1.5} />,
    idle:        'border-2 border-white/12 bg-white/5 text-gray-500 hover:border-emerald-400/50 hover:bg-emerald-500/10 hover:text-emerald-400',
    active:      'border-2 border-emerald-500/70 bg-emerald-500/18 text-emerald-300',
    splitIdle:   'border border-white/10 bg-white/5 text-gray-500 hover:border-emerald-400/50 hover:bg-emerald-500/10',
    splitActive: 'border-2 border-emerald-500/60 bg-emerald-500/18 text-emerald-300',
  },
  {
    value: PaymentMethod.QR,
    label: 'QR',
    cortesiaOnly: false,
    icon: <Icon name="qr" size={28} strokeWidth={1.5} />,
    idle:        'border-2 border-white/12 bg-white/5 text-gray-500 hover:border-primary-400/50 hover:bg-primary-500/10 hover:text-primary-400',
    active:      'border-2 border-primary-500/70 bg-primary-500/18 text-primary-300',
    splitIdle:   'border border-white/10 bg-white/5 text-gray-500 hover:border-primary-400/50 hover:bg-primary-500/10',
    splitActive: 'border-2 border-primary-500/60 bg-primary-500/18 text-primary-300',
  },
  {
    value: PaymentMethod.TRANSFER,
    label: 'Transferencia',
    cortesiaOnly: false,
    icon: <Icon name="card" size={28} strokeWidth={1.5} />,
    idle:        'border-2 border-white/12 bg-white/5 text-gray-500 hover:border-violet-400/50 hover:bg-violet-500/10 hover:text-violet-400',
    active:      'border-2 border-violet-500/70 bg-violet-500/18 text-violet-300',
    splitIdle:   'border border-white/10 bg-white/5 text-gray-500 hover:border-violet-400/50 hover:bg-violet-500/10',
    splitActive: 'border-2 border-violet-500/60 bg-violet-500/18 text-violet-300',
  },
  {
    value: PaymentMethod.CORTESIA,
    label: 'Cortesía',
    cortesiaOnly: true,
    icon: <Icon name="gift" size={28} strokeWidth={1.5} />,
    idle:        'border-2 border-white/12 bg-white/5 text-gray-500 hover:border-amber-400/50 hover:bg-amber-500/10 hover:text-amber-400',
    active:      'border-2 border-amber-500/70 bg-amber-500/18 text-amber-300',
    splitIdle:   'border border-white/10 bg-white/5 text-gray-500 hover:border-amber-400/50 hover:bg-amber-500/10',
    splitActive: 'border-2 border-amber-500/60 bg-amber-500/18 text-amber-300',
  },
];

const methodMap = Object.fromEntries(BASE_PAYMENT_METHODS.map((m) => [m.value, m]));

/* ─── Sub-componente: encabezado de paso ─────────────────────────────────── */

function StepHeader({ n, label, done }: { n: number; label: string; done: boolean }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <div className={[
        'w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-all duration-200',
        done
          ? 'bg-emerald-500 text-white shadow-[0_2px_6px_oklch(0.55_0.18_145/0.30)]'
          : 'bg-white/8 text-gray-600',
      ].join(' ')}>
        {done ? (
          <Icon name="check" size={14} strokeWidth={2.5} />
        ) : (
          <span className="text-xs font-black">{n}</span>
        )}
      </div>
      <span className={`text-sm font-bold tracking-wide ${done ? 'text-gray-600' : 'text-gray-700'}`}>
        {label}
      </span>
    </div>
  );
}

/* ─── Componente principal ───────────────────────────────────────────────── */

export function PaymentModal({ isOpen, onClose, total, onConfirm, onDeferPayment, allowCortesia = false }: Props) {
  const { setOrderType } = useCartStore();

  const PAYMENT_METHODS = BASE_PAYMENT_METHODS.filter((m) => !m.cortesiaOnly || allowCortesia);
  // En split mode CORTESIA no aplica (es todo-o-nada)
  const SPLIT_METHODS = PAYMENT_METHODS.filter((m) => m.value !== PaymentMethod.CORTESIA);

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
    setOrderType(selectedType);   // persiste en el store para la próxima vez
    setLoading(true);
    try {
      const payments: PaymentEntry[] = splitMode
        ? splitPayments
        : [{ method: selectedMethod!, amount: total }];
      await onConfirm(payments, customerValue, selectedType);  // pasa el tipo fresco
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
    setOrderType(selectedType);   // persiste en el store para la próxima vez
    setLoading(true);
    try { await onDeferPayment(customerValue, selectedType); resetState(); } finally { setLoading(false); }
  };

  /* ── Render ── */
  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Nuevo pedido" size="3xl">
      {/* Desktop: 2 columnas. Mobile: apilado */}
      <div className="flex flex-col lg:flex-row lg:gap-x-6">

        {/* ══════════════════════════════════════
            COLUMNA IZQUIERDA — Pasos 1 + 2
        ══════════════════════════════════════ */}
        <div className="flex-1 space-y-5 lg:border-r lg:border-white/8 lg:pr-6">

          {/* PASO 1 — TIPO DE PEDIDO */}
          <div>
            <StepHeader n={1} label="Tipo de pedido" done={step1Done} />
            <div className="grid grid-cols-3 gap-2">
              {ORDER_TYPES.map((t) => (
                <button
                  key={t.value}
                  onClick={() => setSelectedType(t.value)}
                  className={[
                    'flex flex-col items-center gap-1.5 py-3 px-2 rounded-2xl transition-all duration-150 text-center',
                    selectedType === t.value ? t.active : t.idle,
                  ].join(' ')}
                >
                  {t.icon}
                  <span className="text-sm font-bold leading-tight">{t.label}</span>
                  <span className="text-[11px] opacity-70 leading-tight hidden sm:block lg:hidden xl:block">{t.desc}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="border-t border-white/8" />

          {/* PASO 2 — CLIENTE */}
          <div>
            <StepHeader n={2} label="Cliente" done={step2Done} />

            {customerConfirmed && customerValue === null ? (
              <div className="flex items-center justify-between px-4 py-3 rounded-2xl bg-gray-50 border-2 border-gray-200">
                <div className="flex items-center gap-2 text-sm text-gray-600 font-medium">
                  <Icon name="user" size={16} strokeWidth={2} className="text-gray-400" />
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
                {!customerConfirmed && (
                  <button
                    type="button"
                    onClick={handleNoCustomer}
                    className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-2xl
                      border-2 border-white/10 text-sm font-medium text-gray-500
                      hover:border-white/20 hover:text-gray-400 hover:bg-white/6 transition-all duration-150"
                  >
                    <Icon name="ban" size={16} strokeWidth={2} />
                    Sin cliente para este pedido
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ══════════════════════════════════════
            COLUMNA DERECHA — Paso 3 + Footer
        ══════════════════════════════════════ */}
        <div className="flex-1 flex flex-col space-y-5 mt-7 lg:mt-0">

          {/* PASO 3 — MÉTODO DE PAGO */}
          <div className="flex-1">
            <StepHeader n={3} label="Método de pago" done={step3Done} />

            {!splitMode ? (
              <>
                <div className={`grid gap-2 ${PAYMENT_METHODS.length === 4 ? 'grid-cols-2' : 'grid-cols-3'}`}>
                  {PAYMENT_METHODS.map((m) => (
                    <button
                      key={m.value}
                      onClick={() => setSelectedMethod(m.value)}
                      className={[
                        'flex flex-col items-center gap-2 py-4 px-2 rounded-2xl transition-all duration-150',
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
                    className="mt-3 w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl
                      text-xs font-medium text-gray-500 hover:text-primary-400 hover:bg-primary-500/10
                      border-2 border-white/10 hover:border-primary-500/40 transition-all"
                  >
                    <Icon name="plus" size={14} strokeWidth={2} />
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
                    <Icon name="chevron-left" size={12} strokeWidth={2} />
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
                    <span className="text-gray-500">
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
                        <div key={i} className="flex items-center gap-1.5 pl-3 pr-2 py-1.5 rounded-full bg-white/8 border border-white/12 text-sm">
                          <span className="font-semibold text-gray-700">{m?.label ?? p.method}</span>
                          <span className="text-gray-500">Bs {p.amount.toFixed(2)}</span>
                          <button
                            onClick={() => handleRemoveSplit(i)}
                            className="w-4 h-4 rounded-full bg-white/15 hover:bg-red-500/60 flex items-center justify-center text-white transition-colors ml-0.5"
                            aria-label="Quitar"
                          >
                            <Icon name="x" size={10} strokeWidth={3} />
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
                          className="w-full pl-10 pr-3 py-2.5 text-sm border-2 border-white/12 rounded-xl bg-[var(--color-surface-card)] text-gray-700
                            focus:outline-none focus:ring-0 focus:border-primary-400 transition-[border-color]"
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

          {/* FOOTER — TOTAL + CONFIRMAR */}
          <div className="border-t border-white/8 pt-4 space-y-3">
            <div className="flex items-baseline justify-between px-1">
              <span className="text-sm font-semibold text-gray-500">Total</span>
              <span className="font-heading font-black text-3xl text-gray-900">
                Bs {total.toFixed(2)}
              </span>
            </div>

            {!canConfirm && (
              <div className="flex flex-wrap gap-1.5 px-1">
                {!step1Done && (
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-white/8 text-gray-600">Selecciona tipo de pedido</span>
                )}
                {!step2Done && (
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-white/8 text-gray-600">Confirma el cliente</span>
                )}
                {!step3Done && (
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-white/8 text-gray-600">Elige método de pago</span>
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
                  : 'bg-white/6 text-gray-500 cursor-not-allowed',
              ].join(' ')}
            >
              {loading ? 'Procesando…' : canConfirm ? `Confirmar pedido · Bs ${total.toFixed(2)}` : 'Confirmar pedido'}
            </button>

            {onDeferPayment && (
              <button
                onClick={handleDefer}
                disabled={!step1Done || !step2Done || loading}
                className={[
                  'w-full py-3.5 rounded-2xl text-base font-bold transition-all duration-200',
                  step1Done && step2Done && !loading
                    ? 'bg-amber-400 hover:bg-amber-500/100 text-amber-950 shadow-[0_4px_16px_oklch(0.82_0.17_85/0.35)] active:scale-[0.98]'
                    : 'bg-white/6 text-gray-500 cursor-not-allowed',
                ].join(' ')}
              >
                {loading ? 'Procesando…' : 'Cobrar después · dejar pendiente'}
              </button>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
}
