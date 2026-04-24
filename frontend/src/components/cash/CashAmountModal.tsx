import { useState, useEffect } from 'react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Modal } from '../ui/Modal';

interface Breakdown {
  openingAmount: number;
  cashSales: number;
  expectedAmount: number;
}

interface CashAmountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (amount: number, notes?: string) => Promise<void>;
  title: string;
  subtitle?: string;
  amountLabel: string;
  confirmLabel: string;
  /** Si se provee, precarga el input con este valor al abrir el modal. */
  defaultAmount?: number;
  /** Si se provee, muestra el desglose apertura + ventas = esperado encima del input. */
  breakdown?: Breakdown;
}

export function CashAmountModal({
  isOpen, onClose, onConfirm, title, subtitle, amountLabel, confirmLabel,
  defaultAmount, breakdown,
}: CashAmountModalProps) {
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  // Precarga el monto cada vez que el modal se abre
  useEffect(() => {
    if (isOpen) {
      setAmount(defaultAmount !== undefined ? defaultAmount.toFixed(2) : '');
      setNotes('');
    }
  }, [isOpen, defaultAmount]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onConfirm(Number(amount), notes || undefined);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      {subtitle && (
        <p className="text-xs text-gray-400 -mt-2 mb-4 font-medium">{subtitle}</p>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        {breakdown && (
          <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 space-y-2.5">
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-500">Monto inicial</span>
              <span className="font-medium text-gray-700">Bs {breakdown.openingAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-500">Ventas en efectivo</span>
              <span className="font-medium text-emerald-600">+ Bs {breakdown.cashSales.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center pt-2.5 border-t border-gray-200">
              <span className="text-sm font-semibold text-gray-700">Esperado en caja</span>
              <span className="font-heading font-black text-base text-gray-900">
                Bs {breakdown.expectedAmount.toFixed(2)}
              </span>
            </div>
          </div>
        )}

        <Input
          label={amountLabel}
          type="number"
          min="0"
          step="0.01"
          required
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0.00"
          leftAddon={<span className="text-gray-400 text-sm font-medium">Bs</span>}
          inputSize="lg"
        />
        <Input
          label="Nota (opcional)"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Ej: Turno mañana"
        />
        <div className="flex gap-3 pt-1">
          <Button type="button" variant="secondary" fullWidth onClick={onClose}>Cancelar</Button>
          <Button type="submit" fullWidth loading={loading}>{confirmLabel}</Button>
        </div>
      </form>
    </Modal>
  );
}
