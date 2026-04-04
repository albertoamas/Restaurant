import { useState } from 'react';
import { PaymentMethod } from '@pos/shared';
import type { CreateCustomerRequest } from '@pos/shared';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { CustomerPicker } from './CustomerPicker';

export type CustomerPayload = { customerId?: string; createCustomer?: CreateCustomerRequest } | null;

interface Props {
  isOpen: boolean;
  onClose: () => void;
  total: number;
  onConfirm: (method: PaymentMethod, customer: CustomerPayload) => Promise<void>;
}

const methods = [
  {
    value: PaymentMethod.CASH,
    label: 'Efectivo',
    icon: (
      <svg className="w-9 h-9" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
    color: 'border-2 border-emerald-200 bg-gradient-to-b from-emerald-50 to-white hover:border-emerald-400 hover:shadow-[0_4px_12px_oklch(0.55_0.18_145/0.20)] text-emerald-700',
  },
  {
    value: PaymentMethod.QR,
    label: 'QR',
    icon: (
      <svg className="w-9 h-9" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
      </svg>
    ),
    color: 'border-2 border-primary-200 bg-primary-50/65 hover:border-primary-400 hover:bg-primary-100/70 hover:shadow-[0_3px_10px_oklch(0.45_0.16_235/0.18)] text-primary-800',
  },
  {
    value: PaymentMethod.TRANSFER,
    label: 'Transferencia',
    icon: (
      <svg className="w-9 h-9" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
      </svg>
    ),
    color: 'border-2 border-violet-200 bg-gradient-to-b from-violet-50 to-white hover:border-violet-400 hover:shadow-[0_4px_12px_oklch(0.55_0.20_290/0.20)] text-violet-700',
  },
];

function quickAmounts(total: number): number[] {
  const ceil = Math.ceil(total / 10) * 10;
  return [...new Set([ceil, ceil + 10, ceil + 20, ceil + 50])]
    .filter((v) => v >= total)
    .slice(0, 4);
}

export function PaymentModal({ isOpen, onClose, total, onConfirm }: Props) {
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'select' | 'cash'>('select');
  const [received, setReceived] = useState('');
  const [customerValue, setCustomerValue] = useState<CustomerPayload>(null);

  const receivedNum = received === '' ? NaN : parseFloat(received);
  const change = isNaN(receivedNum) ? null : receivedNum - total;
  const changeValid = change !== null && change >= -0.001;

  const resetState = () => {
    setStep('select');
    setReceived('');
    setCustomerValue(null);
  };

  const handleClose = () => { resetState(); onClose(); };

  const handleMethodClick = (method: PaymentMethod) => {
    if (method === PaymentMethod.CASH) {
      setStep('cash');
    } else {
      confirmPayment(method);
    }
  };

  const confirmPayment = async (method: PaymentMethod) => {
    setLoading(true);
    try {
      await onConfirm(method, customerValue);
      resetState();
    } finally {
      setLoading(false);
    }
  };

  const appendDigit = (d: string) =>
    setReceived((prev) => {
      if (d === '.' && prev.includes('.')) return prev;
      if (d === '.' && prev === '') return '0.';
      return prev + d;
    });

  const deleteLast = () => setReceived((prev) => prev.slice(0, -1));

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={step === 'select' ? 'Método de Pago' : 'Pago en Efectivo'}
    >
      {step === 'select' ? (
        <>
          <div className="text-center mb-4">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1">Total a cobrar</p>
            <p className="font-heading font-black text-4xl text-gray-900">Bs {total.toFixed(2)}</p>
          </div>

          <div className="mb-4">
            <CustomerPicker onCustomerChange={setCustomerValue} />
          </div>

          <div className="grid grid-cols-3 gap-3">
            {methods.map((m) => (
              <button
                key={m.value}
                onClick={() => handleMethodClick(m.value)}
                disabled={loading}
                className={[
                  'flex flex-col items-center gap-2.5 p-5 rounded-2xl transition-all duration-150',
                  'active:scale-[0.96] disabled:opacity-50',
                  m.color,
                ].join(' ')}
              >
                {m.icon}
                <span className="text-sm font-semibold">{m.label}</span>
              </button>
            ))}
          </div>
        </>
      ) : (
        <>
          <div className="flex justify-between items-center mb-4">
            <span className="text-sm text-gray-500 font-medium">Total</span>
            <span className="font-heading font-bold text-xl text-gray-900">Bs {total.toFixed(2)}</span>
          </div>

          {/* Amount received display */}
          <div className="bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 mb-3 text-right">
            <p className="text-xs text-gray-400 mb-1 font-medium">Monto recibido</p>
            <p className="font-heading font-black text-3xl text-gray-900 tracking-wide min-h-[2.5rem]">
              {received === '' ? (
                <span className="text-gray-300">0.00</span>
              ) : (
                `Bs ${received}`
              )}
            </p>
          </div>

          {/* Change display */}
          <div className={[
            'rounded-2xl px-4 py-2.5 mb-4 text-right border transition-colors',
            changeValid
              ? 'bg-emerald-50 border-emerald-200'
              : change !== null
              ? 'bg-red-50 border-red-200'
              : 'bg-gray-50 border-gray-200',
          ].join(' ')}>
            <p className="text-xs text-gray-400 mb-0.5 font-medium">Vuelto</p>
            <p className={[
              'font-heading font-black text-2xl',
              changeValid ? 'text-emerald-600' : change !== null ? 'text-red-500' : 'text-gray-300',
            ].join(' ')}>
              {change === null
                ? '—'
                : changeValid
                ? `Bs ${change.toFixed(2)}`
                : `Faltan Bs ${Math.abs(change).toFixed(2)}`}
            </p>
          </div>

          {/* Quick amounts */}
          <div className="flex gap-2 mb-3">
            {quickAmounts(total).map((amt) => (
              <button
                key={amt}
                onClick={() => setReceived(String(amt))}
                className="flex-1 py-2 text-sm font-bold bg-primary-50 border border-primary-200 text-primary-700 rounded-xl hover:bg-primary-100 transition-colors"
              >
                Bs {amt}
              </button>
            ))}
          </div>

          {/* Numeric keypad */}
          <div className="grid grid-cols-3 gap-2 mb-4">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0'].map((d) => (
              <button
                key={d}
                onClick={() => appendDigit(d)}
                className="py-3.5 text-xl font-bold text-gray-800 bg-white border border-gray-200 hover:border-gray-300 hover:bg-gray-50 rounded-xl transition-colors active:scale-[0.96] shadow-[0_1px_2px_oklch(0.13_0.012_260/0.06)]"
              >
                {d}
              </button>
            ))}
            <button
              onClick={deleteLast}
              className="py-3.5 flex items-center justify-center bg-white border border-gray-200 hover:border-gray-300 hover:bg-gray-50 rounded-xl transition-colors active:scale-[0.96] shadow-[0_1px_2px_oklch(0.13_0.012_260/0.06)]"
              aria-label="Borrar"
            >
              <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M3 12l6.414 6.414a2 2 0 001.414.586H19a2 2 0 002-2V7a2 2 0 00-2-2h-8.172a2 2 0 00-1.414.586L3 12z" />
              </svg>
            </button>
          </div>

          <div className="flex gap-3">
            <Button variant="secondary" onClick={() => setStep('select')} disabled={loading}>
              Atrás
            </Button>
            <Button
              variant="emerald"
              fullWidth
              disabled={!changeValid || loading}
              loading={loading}
              onClick={() => confirmPayment(PaymentMethod.CASH)}
            >
              {loading
                ? 'Procesando...'
                : changeValid
                ? `Confirmar · Vuelto Bs ${change!.toFixed(2)}`
                : 'Ingresa el monto'}
            </Button>
          </div>
        </>
      )}
    </Modal>
  );
}
