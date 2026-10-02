import { useState, useEffect } from 'react';
import { OrderType } from '@pos/shared';
import type { CreateCustomerRequest } from '@pos/shared';
import { Modal } from '../ui/Modal';
import { Icon } from '../ui/Icon';
import { Button } from '../ui/Button';
import { CustomerPicker } from './CustomerPicker';
import { PaymentMethodSection, optionClass } from './PaymentMethodSection';
import { usePaymentSelection, type PaymentEntry } from './usePaymentSelection';
import { useCartStore } from '../../store/cart.store';
import { bs } from '../../utils/money';

export type CustomerPayload = { customerId?: string; createCustomer?: CreateCustomerRequest } | null;
export type { PaymentEntry };

interface Props {
  isOpen: boolean;
  onClose: () => void;
  total: number;
  onConfirm: (payments: PaymentEntry[], customer: CustomerPayload, orderType: OrderType) => Promise<void>;
  onDeferPayment?: (customer: CustomerPayload, orderType: OrderType) => Promise<void>;
  allowCortesia?: boolean;
}

const ORDER_TYPES = [
  { value: OrderType.DINE_IN,  label: 'Local',       desc: 'Consumir en el local', icon: 'card' as const },
  { value: OrderType.TAKEOUT,  label: 'Para llevar', desc: 'El cliente retira',    icon: 'bag' as const },
  { value: OrderType.DELIVERY, label: 'Delivery',    desc: 'Entrega a domicilio',  icon: 'map' as const },
];

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

/** Cobro de un pedido nuevo en el POS: tipo, cliente y método de pago, los tres obligatorios. */
export function PaymentModal({ isOpen, onClose, total, onConfirm, onDeferPayment, allowCortesia = false }: Props) {
  const { setOrderType } = useCartStore();
  const payment = usePaymentSelection(total);

  const [selectedType, setSelectedType] = useState<OrderType | null>(null);
  const [customerConfirmed, setCustomerConfirmed] = useState(false);
  const [customerValue, setCustomerValue]         = useState<CustomerPayload>(null);
  const [pickerKey, setPickerKey]                 = useState(0);
  const [loading, setLoading] = useState(false);

  const step1Done = selectedType !== null;
  const step2Done = customerConfirmed;
  const step3Done = payment.done;
  const canConfirm = step1Done && step2Done && step3Done && !loading;
  // Qué falta para confirmar, dicho en el botón (en vez de etiquetas grises aparte).
  const missing = !step1Done ? 'Elige el tipo de pedido'
    : !step2Done ? 'Elige un cliente o marca sin cliente'
    : !step3Done ? (payment.splitMode ? 'Completa el pago dividido' : 'Elige el método de pago')
    : null;

  const resetState = () => {
    setSelectedType(null);
    setCustomerConfirmed(false);
    setCustomerValue(null);
    setPickerKey((k) => k + 1);
    payment.reset();
  };

  useEffect(() => {
    if (isOpen) resetState();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const handleClose = () => { resetState(); onClose(); };

  const handleCustomerChange = (payload: CustomerPayload) => {
    setCustomerValue(payload);
    setCustomerConfirmed(payload !== null);
  };

  const handleNoCustomer = () => {
    setCustomerValue(null);
    setCustomerConfirmed(true);
    setPickerKey((k) => k + 1);
  };

  const handleConfirm = async () => {
    if (!canConfirm || !selectedType) return;
    setOrderType(selectedType);
    setLoading(true);
    try {
      await onConfirm(payment.payments(), customerValue, selectedType);
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
            <span className="text-display font-bold text-main font-heading">{bs(total)}</span>
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

          <section>
            <StepHeader n={2} label="Cliente" done={step2Done} />
            {customerConfirmed && customerValue === null ? (
              <div className="flex items-center justify-between min-h-12 px-4 rounded-control bg-surface-2 border border-line">
                <div className="flex items-center gap-2 text-body text-main font-medium">
                  <Icon name="user" size={16} className="text-muted" />
                  Sin cliente
                </div>
                <Button variant="ghost" size="sm" onClick={() => { setCustomerConfirmed(false); setPickerKey((k) => k + 1); }}>
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

        {/* Paso 3 */}
        <section className="flex-1 mt-6 lg:mt-0">
          <StepHeader n={3} label="Método de pago" done={step3Done} />
          <PaymentMethodSection selection={payment} allowCortesia={allowCortesia} />
        </section>
      </div>
    </Modal>
  );
}
