import { useState, useEffect } from 'react';
import { PaymentMethod, OrderType } from '@pos/shared';
import type { CreateCustomerRequest } from '@pos/shared';
import { Modal } from '../ui/Modal';
import { Icon } from '../ui/Icon';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
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
  { value: OrderType.DINE_IN,  label: 'Local',       desc: 'Consumir en el local', icon: 'card' as const },
  { value: OrderType.TAKEOUT,  label: 'Para llevar', desc: 'El cliente retira',    icon: 'bag' as const },
  { value: OrderType.DELIVERY, label: 'Delivery',    desc: 'Entrega a domicilio',  icon: 'map' as const },
];

const BASE_PAYMENT_METHODS = [
  { value: PaymentMethod.CASH,     label: 'Efectivo',      cortesiaOnly: false, icon: 'cash' as const },
  { value: PaymentMethod.QR,       label: 'QR',            cortesiaOnly: false, icon: 'qr' as const },
  { value: PaymentMethod.TRANSFER, label: 'Transferencia', cortesiaOnly: false, icon: 'card' as const },
  { value: PaymentMethod.CORTESIA, label: 'Cortesía',      cortesiaOnly: true,  icon: 'gift' as const },
];

const methodMap = Object.fromEntries(BASE_PAYMENT_METHODS.map((m) => [m.value, m]));

/** Un solo estilo de "elegido" para todas las opciones: el ícono es lo que las distingue. */
const optionClass = (active: boolean) => [
  'flex flex-col items-center justify-center gap-1.5 rounded-card border-2 text-center transition-colors duration-150',
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/60',
  active
    ? 'border-primary-500 bg-primary-500/10 text-primary-800 dark:text-primary-300'
    : 'border-line bg-surface-card text-soft hover:border-line-strong hover:text-main',
].join(' ');

/* ─── Sub-componente: encabezado de paso ─────────────────────────────────── */

function StepHeader({ n, label, done }: { n: number; label: string; done: boolean }) {
  return (
    <div className="flex items-center gap-3 mb-3">
      <span
        className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-label font-bold transition-colors ${
          done ? 'bg-green-700 text-white' : 'bg-surface-2 border border-line text-soft'
        }`}
        aria-hidden="true"
      >
        {done ? <Icon name="check" size={14} strokeWidth={2.5} /> : n}
      </span>
      <h3 className="text-body font-semibold text-main">
        {label}
        {done && <span className="sr-only"> (listo)</span>}
      </h3>
    </div>
  );
}

/* ─── Componente principal ───────────────────────────────────────────────── */

export function PaymentModal({ isOpen, onClose, total, onConfirm, onDeferPayment, allowCortesia = false }: Props) {
  const { setOrderType } = useCartStore();

  const PAYMENT_METHODS = BASE_PAYMENT_METHODS.filter((m) => !m.cortesiaOnly || allowCortesia);
  const SPLIT_METHODS = PAYMENT_METHODS.filter((m) => m.value !== PaymentMethod.CORTESIA);

  const [selectedType, setSelectedType] = useState<OrderType | null>(null);

  const [customerConfirmed, setCustomerConfirmed] = useState(false);
  const [customerValue, setCustomerValue]         = useState<CustomerPayload>(null);
  const [pickerKey, setPickerKey]                 = useState(0);

  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
  const [splitMode, setSplitMode]           = useState(false);
  const [splitPayments, setSplitPayments]   = useState<PaymentEntry[]>([]);
  const [splitMethod, setSplitMethod]       = useState<PaymentMethod | null>(null);
  const [splitAmount, setSplitAmount]       = useState('');

  const [loading, setLoading] = useState(false);

  const assigned      = Math.round(splitPayments.reduce((s, p) => s + p.amount, 0) * 100) / 100;
  const remaining     = Math.round((total - assigned) * 100) / 100;
  const splitComplete = Math.abs(remaining) <= 0.01;

  const step1Done = selectedType !== null;
  const step2Done = customerConfirmed;
  const step3Done = (!splitMode && selectedMethod !== null) || (splitMode && splitComplete);
  const canConfirm = step1Done && step2Done && step3Done && !loading;
  // Qué falta para confirmar, dicho en el botón (en vez de etiquetas grises aparte).
  const missing = !step1Done ? 'Elige el tipo de pedido'
    : !step2Done ? 'Elige un cliente o marca sin cliente'
    : !step3Done ? (splitMode ? 'Completa el pago dividido' : 'Elige el método de pago')
    : null;

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

  useEffect(() => {
    if (isOpen) resetState();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const handleClose = () => { resetState(); onClose(); };

  const handleCustomerChange = (payload: CustomerPayload) => {
    setCustomerValue(payload);
    if (payload !== null) {
      setCustomerConfirmed(true);
    } else {
      setCustomerConfirmed(false);
    }
  };

  const handleNoCustomer = () => {
    setCustomerValue(null);
    setCustomerConfirmed(true);
    setPickerKey((k) => k + 1);
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

  const handleRemoveSplit = (i: number) => {
    setSplitPayments((prev) => prev.filter((_, idx) => idx !== i));
  };

  const handleConfirm = async () => {
    if (!canConfirm || !selectedType) return;
    setOrderType(selectedType);
    setLoading(true);
    try {
      const payments: PaymentEntry[] = splitMode
        ? splitPayments
        : [{ method: selectedMethod!, amount: total }];
      await onConfirm(payments, customerValue, selectedType);
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
    try { await onDeferPayment(customerValue, selectedType); resetState(); } finally { setLoading(false); }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Nuevo pedido"
      size="3xl"
      footer={
        <div className="space-y-3">
          <div className="flex items-baseline justify-between gap-3">
            <span className="text-label font-semibold text-soft">Total</span>
            <span className="text-display font-bold text-main font-heading">Bs {total.toFixed(2)}</span>
          </div>
          <div className={`grid gap-2 ${onDeferPayment ? 'sm:grid-cols-[1fr_auto]' : ''}`}>
            <Button variant="success" size="xl" fullWidth onClick={handleConfirm} disabled={!canConfirm} loading={loading}>
              {loading ? 'Procesando' : missing ?? 'Confirmar pedido'}
            </Button>
            {onDeferPayment && (
              <Button variant="secondary" size="xl" onClick={handleDefer} disabled={!step1Done || !step2Done || loading}>
                <Icon name="clock" size={18} />
                Cobrar después
              </Button>
            )}
          </div>
        </div>
      }
    >
      <div className="flex flex-col lg:flex-row lg:gap-x-6">

        {/* Pasos 1 y 2 */}
        <div className="flex-1 space-y-5 lg:border-r lg:border-line lg:pr-6">

          {/* Paso 1: tipo de pedido */}
          <section>
            <StepHeader n={1} label="Tipo de pedido" done={step1Done} />
            <div role="radiogroup" aria-label="Tipo de pedido" className="grid grid-cols-3 gap-2">
              {ORDER_TYPES.map((t) => (
                <button
                  key={t.value}
                  role="radio"
                  aria-checked={selectedType === t.value}
                  onClick={() => setSelectedType(t.value)}
                  className={`${optionClass(selectedType === t.value)} min-h-20 py-3 px-2`}
                >
                  <Icon name={t.icon} size={22} />
                  <span className="text-label font-semibold leading-tight">{t.label}</span>
                  <span className="text-caption opacity-80 leading-tight hidden sm:block lg:hidden xl:block">{t.desc}</span>
                </button>
              ))}
            </div>
          </section>

          <div className="border-t border-line" />

          {/* Paso 2: cliente */}
          <section>
            <StepHeader n={2} label="Cliente" done={step2Done} />

            {customerConfirmed && customerValue === null ? (
              <div className="flex items-center justify-between min-h-12 px-4 rounded-control bg-surface-2 border border-line">
                <div className="flex items-center gap-2 text-body text-main font-medium">
                  <Icon name="user" size={16} className="text-muted" />
                  Sin cliente
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => { setCustomerConfirmed(false); setPickerKey((k) => k + 1); }}
                >
                  Cambiar
                </Button>
              </div>
            ) : (
              <div className="space-y-2.5">
                <CustomerPicker key={pickerKey} onCustomerChange={handleCustomerChange} />
                {!customerConfirmed && (
                  <Button variant="secondary" fullWidth onClick={handleNoCustomer}>
                    <Icon name="ban" size={16} />
                    Sin cliente para este pedido
                  </Button>
                )}
              </div>
            )}
          </section>
        </div>

        {/* Paso 3: método de pago */}
        <section className="flex-1 mt-6 lg:mt-0">
          <StepHeader n={3} label="Método de pago" done={step3Done} />

          {!splitMode ? (
            <>
              <div
                role="radiogroup"
                aria-label="Método de pago"
                className={`grid gap-2 ${PAYMENT_METHODS.length === 4 ? 'grid-cols-2' : 'grid-cols-3'}`}
              >
                {PAYMENT_METHODS.map((m) => (
                  <button
                    key={m.value}
                    role="radio"
                    aria-checked={selectedMethod === m.value}
                    onClick={() => setSelectedMethod(m.value)}
                    className={`${optionClass(selectedMethod === m.value)} min-h-20 py-3 px-2`}
                  >
                    <Icon name={m.icon} size={24} strokeWidth={1.5} />
                    <span className="text-label font-semibold">{m.label}</span>
                  </button>
                ))}
              </div>

              {selectedMethod !== PaymentMethod.CORTESIA && (
                <Button
                  variant="ghost"
                  fullWidth
                  className="mt-3"
                  onClick={() => { setSplitMode(true); setSplitAmount(total.toFixed(2)); setSelectedMethod(null); }}
                >
                  <Icon name="plus" size={16} />
                  Dividir pago entre varios métodos
                </Button>
              )}
            </>
          ) : (
            /* Pago dividido */
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-label font-semibold text-soft">Pago dividido</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => { setSplitMode(false); setSplitPayments([]); setSplitMethod(null); setSplitAmount(''); }}
                >
                  <Icon name="chevron-left" size={14} strokeWidth={2} />
                  Pago simple
                </Button>
              </div>

              <div>
                <div
                  className="h-2.5 bg-surface-2 border border-line rounded-full overflow-hidden"
                  role="progressbar"
                  aria-label="Monto asignado"
                  aria-valuemin={0}
                  aria-valuemax={total}
                  aria-valuenow={assigned}
                >
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${splitComplete ? 'bg-green-600' : 'bg-amber-500'}`}
                    style={{ width: `${Math.min((assigned / total) * 100, 100)}%` }}
                  />
                </div>
                <div className="flex justify-between mt-1.5 text-label">
                  <span className="text-soft">
                    Asignado <span className="font-semibold text-main">Bs {assigned.toFixed(2)}</span>
                  </span>
                  <span className={splitComplete ? 'text-green-700 dark:text-green-400 font-semibold' : 'text-amber-700 dark:text-amber-300 font-semibold'}>
                    {splitComplete ? 'Completo' : `Falta Bs ${remaining.toFixed(2)}`}
                  </span>
                </div>
              </div>

              {splitPayments.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {splitPayments.map((p, i) => {
                    const m = methodMap[p.method];
                    return (
                      <div key={i} className="flex items-center gap-1.5 pl-3 pr-1 min-h-9 rounded-full bg-surface-2 border border-line text-label">
                        <span className="font-semibold text-main">{m?.label ?? p.method}</span>
                        <span className="text-soft">Bs {p.amount.toFixed(2)}</span>
                        <button
                          onClick={() => handleRemoveSplit(i)}
                          className="w-7 h-7 rounded-full flex items-center justify-center text-muted hover:text-red-700 hover:bg-red-500/10 transition-colors"
                          aria-label={`Quitar ${m?.label ?? p.method} Bs ${p.amount.toFixed(2)}`}
                        >
                          <Icon name="x" size={14} strokeWidth={2.5} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}

              {!splitComplete && (
                <div className="space-y-2.5">
                  <div role="radiogroup" aria-label="Método de este pago" className="grid grid-cols-3 gap-2">
                    {SPLIT_METHODS.map((m) => (
                      <button
                        key={m.value}
                        role="radio"
                        aria-checked={splitMethod === m.value}
                        onClick={() => setSplitMethod(m.value)}
                        className={`${optionClass(splitMethod === m.value)} min-h-11 px-2 text-label font-semibold`}
                      >
                        {m.label}
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-2 items-end">
                    <div className="flex-1">
                      <Input
                        aria-label="Monto de este pago"
                        type="number"
                        min="0.01"
                        step="0.01"
                        leftAddon="Bs"
                        value={splitAmount}
                        onChange={(e) => setSplitAmount(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAddSplit()}
                        placeholder={remaining.toFixed(2)}
                      />
                    </div>
                    <Button
                      onClick={handleAddSplit}
                      disabled={!splitMethod || !splitAmount || parseFloat(splitAmount) <= 0}
                    >
                      <Icon name="plus" size={16} />
                      Agregar
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </section>
      </div>
    </Modal>
  );
}
