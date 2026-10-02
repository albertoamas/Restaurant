import { useState, useEffect, useId } from 'react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Input } from '../ui/Input';
import { Modal } from '../ui/Modal';
import { cashResult } from './cash-result';
import { bs } from '../../utils/money';

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
  /** Qué hay que escribir, bajo el campo del monto. */
  amountHint?: string;
  confirmLabel: string;
  /** Cierre: desglose apertura + ventas = esperado, y el resultado en vivo al escribir el conteo. */
  breakdown?: Breakdown;
  /** Apertura: atajo para repetir un monto conocido (ej.: el inicial del último turno). */
  suggestion?: { amount: number; label: string };
}

/**
 * Abrir o cerrar caja. El monto empieza vacío a propósito: al cerrar hay que contar el cajón,
 * no confirmar el esperado (prellenarlo escondía los faltantes).
 */
export function CashAmountModal({
  isOpen, onClose, onConfirm, title, subtitle, amountLabel, amountHint, confirmLabel,
  breakdown, suggestion,
}: CashAmountModalProps) {
  const formId = useId();
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setAmount('');
      setNotes('');
    }
  }, [isOpen]);

  const counted = parseFloat(amount);
  const hasAmount = amount !== '' && !isNaN(counted) && counted >= 0;
  const result = breakdown && hasAmount ? cashResult(counted - breakdown.expectedAmount, true) : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasAmount) return;
    setLoading(true);
    try {
      await onConfirm(counted, notes.trim() || undefined);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      footer={
        <div className="flex gap-3">
          <Button type="button" variant="secondary" fullWidth onClick={onClose} disabled={loading}>Cancelar</Button>
          <Button type="submit" form={formId} fullWidth loading={loading} disabled={!hasAmount}>{confirmLabel}</Button>
        </div>
      }
    >
      <form id={formId} onSubmit={handleSubmit} className="space-y-4">
        {subtitle && <p className="text-label text-soft -mt-1">{subtitle}</p>}

        {breakdown && (
          <dl className="rounded-card bg-surface-2 border border-line px-4 py-3 space-y-2">
            <div className="flex justify-between text-label">
              <dt className="text-soft">Monto inicial</dt>
              <dd className="text-main tabular-nums">{bs(breakdown.openingAmount)}</dd>
            </div>
            <div className="flex justify-between text-label">
              <dt className="text-soft">Ventas en efectivo</dt>
              <dd className="text-main tabular-nums">{bs(breakdown.cashSales)}</dd>
            </div>
            <div className="flex justify-between items-baseline pt-2 border-t border-line">
              <dt className="text-body font-semibold text-main">Esperado en caja</dt>
              <dd className="text-heading font-bold text-main tabular-nums">{bs(breakdown.expectedAmount)}</dd>
            </div>
          </dl>
        )}

        <div>
          <Input
            label={amountLabel}
            type="number"
            inputMode="decimal"
            min="0"
            step="0.01"
            required
            autoFocus
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            leftAddon="Bs"
            inputSize="lg"
            hint={amountHint}
          />
          {suggestion && (
            <Button type="button" variant="secondary" size="sm" className="mt-2" onClick={() => setAmount(suggestion.amount.toFixed(2))}>
              {suggestion.label}
            </Button>
          )}
        </div>

        {result && (
          <div className="flex items-center justify-between gap-3 rounded-card border border-line px-4 py-3" aria-live="polite">
            <span className="text-body font-semibold text-main">Resultado del conteo</span>
            <Badge variant={result.tone}>{result.label}</Badge>
          </div>
        )}

        <Input
          label="Nota (opcional)"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Ej.: turno mañana"
        />
      </form>
    </Modal>
  );
}
