import { PaymentMethod } from '@pos/shared';
import { Icon } from '../ui/Icon';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import type { PaymentSelection } from './usePaymentSelection';
import { bs } from '../../utils/money';

export const PAYMENT_METHODS = [
  { value: PaymentMethod.CASH,     label: 'Efectivo',      cortesiaOnly: false, icon: 'cash' as const },
  { value: PaymentMethod.QR,       label: 'QR',            cortesiaOnly: false, icon: 'qr' as const },
  { value: PaymentMethod.TRANSFER, label: 'Transferencia', cortesiaOnly: false, icon: 'card' as const },
  { value: PaymentMethod.CORTESIA, label: 'Cortesía',      cortesiaOnly: true,  icon: 'gift' as const },
];

export const paymentMethodLabel = (m: PaymentMethod) => PAYMENT_METHODS.find((x) => x.value === m)?.label ?? m;

/** Un solo estilo de "elegido" para todas las opciones: el ícono es lo que las distingue. */
export const optionClass = (active: boolean) => [
  'flex flex-col items-center justify-center gap-1.5 rounded-card border-2 text-center transition-colors duration-150',
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/60',
  active
    ? 'border-primary-500 bg-primary-500/10 text-primary-800 dark:bg-primary-500/15 dark:text-main'
    : 'border-line bg-surface-card text-soft hover:border-line-strong hover:text-main',
].join(' ');

/** Billetes con los que suele pagarse un monto: el exacto y los redondeos hacia arriba. */
export function cashSuggestions(total: number): number[] {
  const out = [total];
  for (const step of [10, 20, 50, 100, 200]) {
    const v = Math.ceil(total / step) * step;
    if (v > total && !out.includes(v)) out.push(v);
  }
  return out.slice(0, 4);
}

/** Cambio a devolver en efectivo. Ayuda para el cajero: no cambia lo que se registra. */
function CashChange({ s }: { s: PaymentSelection }) {
  const received = parseFloat(s.cashReceived);
  const hasValue = !isNaN(received) && received > 0;
  const diff = Math.round((received - s.total) * 100) / 100;

  return (
    <div className="mt-3 rounded-card border border-line bg-surface-2 p-3 space-y-2.5">
      <Input
        label="¿Con cuánto paga?"
        type="number"
        inputMode="decimal"
        min="0"
        step="0.01"
        leftAddon="Bs"
        placeholder={s.total.toFixed(2)}
        value={s.cashReceived}
        onChange={(e) => s.setCashReceived(e.target.value)}
      />
      <div className="flex flex-wrap gap-2">
        {cashSuggestions(s.total).map((v) => (
          <button
            key={v}
            type="button"
            onClick={() => s.setCashReceived(v.toFixed(2))}
            className={`${optionClass(hasValue && received === v)} flex-row min-h-9 px-3 text-label font-semibold`}
          >
            {v === s.total ? 'Exacto' : `Bs ${v}`}
          </button>
        ))}
      </div>
      {hasValue && (
        <p className={`flex items-baseline justify-between text-body font-semibold ${diff < 0 ? 'text-amber-700 dark:text-amber-300' : 'text-main'}`}>
          <span>{diff < 0 ? 'Falta' : 'Cambio'}</span>
          <span className="text-heading font-bold tabular-nums">{bs(Math.abs(diff))}</span>
        </p>
      )}
    </div>
  );
}

interface Props {
  selection: PaymentSelection;
  /** Cortesía: solo el dueño. */
  allowCortesia?: boolean;
}

/** Elección del método de pago, simple o dividido. Mismo aspecto en el POS y en Pedidos. */
export function PaymentMethodSection({ selection: s, allowCortesia = false }: Props) {
  const methods = PAYMENT_METHODS.filter((m) => !m.cortesiaOnly || allowCortesia);
  const splitMethods = methods.filter((m) => m.value !== PaymentMethod.CORTESIA);

  if (!s.splitMode) {
    return (
      <>
        <div role="radiogroup" aria-label="Método de pago" className={`grid gap-2 ${methods.length === 4 ? 'grid-cols-2' : 'grid-cols-3'}`}>
          {methods.map((m) => (
            <button
              key={m.value}
              role="radio"
              aria-checked={s.selectedMethod === m.value}
              onClick={() => s.setSelectedMethod(m.value)}
              className={`${optionClass(s.selectedMethod === m.value)} min-h-20 py-3 px-2`}
            >
              <Icon name={m.icon} size={24} strokeWidth={1.5} />
              <span className="text-label font-semibold">{m.label}</span>
            </button>
          ))}
        </div>
        {s.selectedMethod === PaymentMethod.CASH && <CashChange s={s} />}
        {s.selectedMethod !== PaymentMethod.CORTESIA && (
          <Button variant="ghost" fullWidth className="mt-3" onClick={s.startSplit}>
            <Icon name="plus" size={16} />
            Dividir pago entre varios métodos
          </Button>
        )}
      </>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-label font-semibold text-soft">Pago dividido</span>
        <Button variant="ghost" size="sm" onClick={s.cancelSplit}>
          Volver a pago simple
        </Button>
      </div>

      <div>
        <div
          className="h-2.5 bg-surface-2 border border-line rounded-full overflow-hidden"
          role="progressbar"
          aria-label="Monto asignado"
          aria-valuemin={0}
          aria-valuemax={s.total}
          aria-valuenow={s.assigned}
        >
          <div
            className={`h-full rounded-full transition-all duration-300 ${s.splitComplete ? 'bg-green-600' : 'bg-amber-500'}`}
            style={{ width: `${Math.min((s.assigned / s.total) * 100, 100)}%` }}
          />
        </div>
        <div className="flex justify-between mt-1.5 text-label">
          <span className="text-soft">
            Asignado <span className="font-semibold text-main">{bs(s.assigned)}</span>
          </span>
          <span className={s.splitComplete ? 'text-green-700 dark:text-green-400 font-semibold' : 'text-amber-700 dark:text-amber-300 font-semibold'}>
            {s.splitComplete ? 'Completo' : `Falta ${bs(s.remaining)}`}
          </span>
        </div>
      </div>

      {s.splitPayments.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {s.splitPayments.map((p, i) => (
            <div key={i} className="flex items-center gap-1.5 pl-3 pr-1 min-h-9 rounded-full bg-surface-2 border border-line text-label">
              <span className="font-semibold text-main">{paymentMethodLabel(p.method)}</span>
              <span className="text-soft">{bs(p.amount)}</span>
              <button
                onClick={() => s.removeSplit(i)}
                className="w-7 h-7 rounded-full flex items-center justify-center text-muted hover:text-red-700 hover:bg-red-500/10 transition-colors"
                aria-label={`Quitar ${paymentMethodLabel(p.method)} ${bs(p.amount)}`}
              >
                <Icon name="x" size={14} strokeWidth={2.5} />
              </button>
            </div>
          ))}
        </div>
      )}

      {!s.splitComplete && (
        <div className="space-y-2.5">
          <div role="radiogroup" aria-label="Método de este pago" className="grid grid-cols-3 gap-2">
            {splitMethods.map((m) => (
              <button
                key={m.value}
                role="radio"
                aria-checked={s.splitMethod === m.value}
                onClick={() => s.setSplitMethod(m.value)}
                className={`${optionClass(s.splitMethod === m.value)} min-h-11 px-2 text-label font-semibold`}
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
                value={s.splitAmount}
                onChange={(e) => s.setSplitAmount(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && s.addSplit()}
                placeholder={s.remaining.toFixed(2)}
              />
            </div>
            <Button onClick={s.addSplit} disabled={!s.splitMethod || !s.splitAmount || parseFloat(s.splitAmount) <= 0}>
              <Icon name="plus" size={16} />
              Agregar
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
