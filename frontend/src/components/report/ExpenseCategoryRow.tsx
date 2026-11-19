import { Icon } from '../ui/Icon';
import { bs } from './index';

interface Props {
  label: string;
  amount: number;
  /** Porcentaje de la categoría sobre el total del período (0 a 100). */
  pct: number;
  onOpen: () => void;
}

/** Barra de una categoría de gasto. Se toca para ver en qué ítem se fue cada monto. */
export function ExpenseCategoryRow({ label, amount, pct, onOpen }: Props) {
  return (
    <li>
      <button
        type="button"
        onClick={onOpen}
        className="group -mx-2 w-[calc(100%+1rem)] rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/60"
      >
        <div className="flex items-baseline justify-between gap-3 text-body">
          <span className="min-w-0 truncate text-main">{label}</span>
          <span className="flex shrink-0 items-center tabular-nums">
            <span className="font-semibold text-main">{bs(amount)}</span>
            <span className="ml-2 inline-block w-10 text-right text-caption text-muted">{Math.round(pct)}%</span>
            <Icon name="chevron-right" size={16} className="ml-1 text-muted transition-transform group-hover:translate-x-0.5" />
          </span>
        </div>
        <div className="mt-1.5 mr-5 h-2 overflow-hidden rounded-full bg-surface-3">
          <div className="h-full rounded-full bg-rose-500" style={{ width: `${Math.min(pct, 100)}%` }} />
        </div>
      </button>
    </li>
  );
}
