import { useState } from 'react';
import { PaymentMethod } from '@pos/shared';
import type { CreateCustomerRequest } from '@pos/shared';
import { Modal } from '../ui/Modal';
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

export function PaymentModal({ isOpen, onClose, total, onConfirm }: Props) {
  const [loading, setLoading] = useState(false);
  const [customerValue, setCustomerValue] = useState<CustomerPayload>(null);

  const resetState = () => setCustomerValue(null);

  const handleClose = () => { resetState(); onClose(); };

  const handleMethodClick = async (method: PaymentMethod) => {
    setLoading(true);
    try {
      await onConfirm(method, customerValue);
      resetState();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Método de Pago">
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
    </Modal>
  );
}
