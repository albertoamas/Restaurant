import { useState } from 'react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Modal } from '../ui/Modal';

interface CashAmountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (amount: number, notes?: string) => Promise<void>;
  title: string;
  subtitle?: string;
  amountLabel: string;
  confirmLabel: string;
}

export function CashAmountModal({
  isOpen, onClose, onConfirm, title, subtitle, amountLabel, confirmLabel,
}: CashAmountModalProps) {
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onConfirm(Number(amount), notes || undefined);
      setAmount('');
      setNotes('');
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
