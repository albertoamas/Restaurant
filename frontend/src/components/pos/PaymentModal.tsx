import { useState } from 'react';
import { PaymentMethod } from '@pos/shared';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  total: number;
  onConfirm: (method: PaymentMethod) => Promise<void>;
}

const methods = [
  {
    value: PaymentMethod.CASH,
    label: 'Efectivo',
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
    color: 'border-emerald-300 bg-emerald-50 hover:bg-emerald-100',
  },
  {
    value: PaymentMethod.QR,
    label: 'QR',
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
      </svg>
    ),
    color: 'border-sky-300 bg-sky-50 hover:bg-sky-100',
  },
  {
    value: PaymentMethod.TRANSFER,
    label: 'Transferencia',
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
      </svg>
    ),
    color: 'border-violet-300 bg-violet-50 hover:bg-violet-100',
  },
];

export function PaymentModal({ isOpen, onClose, total, onConfirm }: Props) {
  const [loading, setLoading] = useState(false);

  const handleConfirm = async (method: PaymentMethod) => {
    setLoading(true);
    try {
      await onConfirm(method);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Método de Pago">
      <div className="text-center mb-6">
        <p className="text-sm text-gray-500">Total a cobrar</p>
        <p className="text-3xl font-bold text-gray-900">S/ {total.toFixed(2)}</p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {methods.map((m) => (
          <button
            key={m.value}
            onClick={() => handleConfirm(m.value)}
            disabled={loading}
            className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all
              active:scale-95 disabled:opacity-50 ${m.color}`}
          >
            {m.icon}
            <span className="text-sm font-medium">{m.label}</span>
          </button>
        ))}
      </div>
    </Modal>
  );
}
