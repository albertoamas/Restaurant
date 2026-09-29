import { useCallback, useState } from 'react';
import { PaymentMethod } from '@pos/shared';

export type PaymentEntry = { method: PaymentMethod; amount: number };

/**
 * Estado de la elección de pago: un método para todo el monto, o varios pagos parciales que
 * deben sumar el total (±0,01). Lo comparten el cobro del POS y "Registrar cobro" de Pedidos.
 */
export function usePaymentSelection(total: number) {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
  const [splitMode, setSplitMode]           = useState(false);
  const [splitPayments, setSplitPayments]   = useState<PaymentEntry[]>([]);
  const [splitMethod, setSplitMethod]       = useState<PaymentMethod | null>(null);
  const [splitAmount, setSplitAmount]       = useState('');

  const assigned      = Math.round(splitPayments.reduce((s, p) => s + p.amount, 0) * 100) / 100;
  const remaining     = Math.round((total - assigned) * 100) / 100;
  const splitComplete = Math.abs(remaining) <= 0.01;
  const done          = (!splitMode && selectedMethod !== null) || (splitMode && splitComplete);

  const reset = useCallback(() => {
    setSelectedMethod(null);
    setSplitMode(false);
    setSplitPayments([]);
    setSplitMethod(null);
    setSplitAmount('');
  }, []);

  const startSplit = () => { setSplitMode(true); setSplitAmount(total.toFixed(2)); setSelectedMethod(null); };
  const cancelSplit = () => { setSplitMode(false); setSplitPayments([]); setSplitMethod(null); setSplitAmount(''); };

  const addSplit = () => {
    if (!splitMethod) return;
    const amount = parseFloat(splitAmount);
    if (isNaN(amount) || amount <= 0) return;
    const capped = Math.min(Math.round(amount * 100) / 100, remaining);
    setSplitPayments((prev) => [...prev, { method: splitMethod, amount: capped }]);
    setSplitMethod(null);
    setSplitAmount('');
  };

  const removeSplit = (i: number) => setSplitPayments((prev) => prev.filter((_, idx) => idx !== i));

  /** Pagos a enviar al backend (solo tiene sentido con `done`). */
  const payments = (): PaymentEntry[] =>
    splitMode ? splitPayments : selectedMethod ? [{ method: selectedMethod, amount: total }] : [];

  return {
    total, selectedMethod, setSelectedMethod,
    splitMode, splitPayments, splitMethod, setSplitMethod, splitAmount, setSplitAmount,
    assigned, remaining, splitComplete, done,
    reset, startSplit, cancelSplit, addSplit, removeSplit, payments,
  };
}

export type PaymentSelection = ReturnType<typeof usePaymentSelection>;
