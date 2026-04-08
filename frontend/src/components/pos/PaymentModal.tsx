import { useState } from 'react';
import { PaymentMethod } from '@pos/shared';
import type { CreateCustomerRequest } from '@pos/shared';
import { Modal } from '../ui/Modal';
import { CustomerPicker } from './CustomerPicker';

export type CustomerPayload = { customerId?: string; createCustomer?: CreateCustomerRequest } | null;
export type PaymentEntry = { method: PaymentMethod; amount: number };

interface Props {
  isOpen: boolean;
  onClose: () => void;
  total: number;
  onConfirm: (payments: PaymentEntry[], customer: CustomerPayload) => Promise<void>;
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
    activeColor: 'border-2 border-emerald-400 bg-emerald-100 text-emerald-800 ring-2 ring-emerald-300/40',
    smallColor: 'border border-emerald-200 bg-emerald-50 hover:border-emerald-400 text-emerald-700',
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
    activeColor: 'border-2 border-primary-400 bg-primary-100 text-primary-900 ring-2 ring-primary-300/40',
    smallColor: 'border border-primary-200 bg-primary-50 hover:border-primary-400 text-primary-800',
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
    activeColor: 'border-2 border-violet-400 bg-violet-100 text-violet-900 ring-2 ring-violet-300/40',
    smallColor: 'border border-violet-200 bg-violet-50 hover:border-violet-400 text-violet-700',
  },
];

const methodMap = Object.fromEntries(methods.map((m) => [m.value, m]));

export function PaymentModal({ isOpen, onClose, total, onConfirm }: Props) {
  const [loading, setLoading] = useState(false);
  const [customerValue, setCustomerValue] = useState<CustomerPayload>(null);
  const [splitMode, setSplitMode] = useState(false);
  const [splitPayments, setSplitPayments] = useState<PaymentEntry[]>([]);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
  const [amountInput, setAmountInput] = useState('');

  const assigned = Math.round(splitPayments.reduce((s, p) => s + p.amount, 0) * 100) / 100;
  const remaining = Math.round((total - assigned) * 100) / 100;
  const splitComplete = Math.abs(remaining) <= 0.01;

  const resetState = () => {
    setCustomerValue(null);
    setSplitMode(false);
    setSplitPayments([]);
    setSelectedMethod(null);
    setAmountInput('');
  };

  const handleClose = () => { resetState(); onClose(); };

  const handleSingleMethod = async (method: PaymentMethod) => {
    setLoading(true);
    try {
      await onConfirm([{ method, amount: total }], customerValue);
      resetState();
    } finally {
      setLoading(false);
    }
  };

  const handleAddSplit = () => {
    if (!selectedMethod) return;
    const amount = parseFloat(amountInput);
    if (isNaN(amount) || amount <= 0) return;
    const capped = Math.min(Math.round(amount * 100) / 100, remaining);
    setSplitPayments((prev) => [...prev, { method: selectedMethod, amount: capped }]);
    setSelectedMethod(null);
    setAmountInput('');
  };

  const handleRemoveSplit = (index: number) => {
    setSplitPayments((prev) => prev.filter((_, i) => i !== index));
  };

  const handleConfirmSplit = async () => {
    if (!splitComplete) return;
    setLoading(true);
    try {
      await onConfirm(splitPayments, customerValue);
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

      {!splitMode ? (
        <>
          <div className="grid grid-cols-3 gap-3">
            {methods.map((m) => (
              <button
                key={m.value}
                onClick={() => handleSingleMethod(m.value)}
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

          <div className="mt-3 flex justify-center">
            <button
              onClick={() => { setSplitMode(true); setAmountInput(remaining.toFixed(2)); }}
              className="text-xs font-medium text-gray-400 hover:text-primary-600 transition-colors px-3 py-1.5 rounded-lg hover:bg-primary-50"
            >
              + Dividir pago
            </button>
          </div>
        </>
      ) : (
        <div className="space-y-3">
          {/* Remaining indicator */}
          <div className="flex justify-between items-center text-sm px-1">
            <span className="text-gray-500">Asignado: <span className="font-semibold text-gray-700">Bs {assigned.toFixed(2)}</span></span>
            <span className={remaining > 0.01 ? 'text-amber-600 font-bold' : 'text-emerald-600 font-bold'}>
              {remaining > 0.01 ? `Restante: Bs ${remaining.toFixed(2)}` : '¡Completo!'}
            </span>
          </div>

          {/* Already-added payments */}
          {splitPayments.length > 0 && (
            <div className="space-y-1.5">
              {splitPayments.map((p, i) => {
                const m = methodMap[p.method];
                return (
                  <div key={i} className="flex items-center justify-between bg-gray-50 rounded-xl px-3 py-2 text-sm">
                    <span className="font-medium text-gray-700">{m?.label ?? p.method}</span>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-900">Bs {p.amount.toFixed(2)}</span>
                      <button
                        onClick={() => handleRemoveSplit(i)}
                        className="text-gray-300 hover:text-red-400 transition-colors"
                        aria-label="Eliminar"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Add next payment — only if not complete yet */}
          {!splitComplete && (
            <div className="border border-gray-200 rounded-2xl p-3 space-y-2.5 bg-gray-50/60">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Agregar pago</p>

              {/* Method selector */}
              <div className="flex gap-2">
                {methods.map((m) => (
                  <button
                    key={m.value}
                    onClick={() => setSelectedMethod(m.value)}
                    className={[
                      'flex-1 py-2 rounded-xl text-xs font-semibold transition-all',
                      selectedMethod === m.value ? m.activeColor : m.smallColor,
                    ].join(' ')}
                  >
                    {m.label}
                  </button>
                ))}
              </div>

              {/* Amount input + add button */}
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-gray-400">Bs</span>
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={amountInput}
                    onChange={(e) => setAmountInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddSplit()}
                    placeholder={remaining.toFixed(2)}
                    className="w-full pl-10 pr-3 py-2 text-sm border border-gray-200 rounded-xl bg-white
                      focus:outline-none focus:ring-2 focus:ring-primary-400/30 focus:border-primary-400
                      transition-[border-color,box-shadow]"
                  />
                </div>
                <button
                  onClick={handleAddSplit}
                  disabled={!selectedMethod || !amountInput || parseFloat(amountInput) <= 0}
                  className="px-4 py-2 rounded-xl text-sm font-semibold bg-primary-600 text-white
                    hover:bg-primary-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Agregar
                </button>
              </div>
            </div>
          )}

          {/* Confirm / back buttons */}
          <div className="flex gap-2 pt-1">
            <button
              onClick={() => { setSplitMode(false); setSplitPayments([]); setSelectedMethod(null); setAmountInput(''); }}
              className="px-4 py-2.5 rounded-xl text-sm font-semibold border border-gray-200 text-gray-600
                hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleConfirmSplit}
              disabled={!splitComplete || loading}
              className="flex-1 py-2.5 rounded-xl text-sm font-bold bg-primary-600 text-white
                hover:bg-primary-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Procesando…' : `Confirmar Bs ${total.toFixed(2)}`}
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}
