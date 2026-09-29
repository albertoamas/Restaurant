import type { ReactNode } from 'react';
import { Icon } from '../ui/Icon';
import type { CartItem as CartItemType } from '../../store/cart.store';

interface Props {
  item: CartItemType;
  onIncrement: () => void;
  /** Con cantidad 1 quita el producto del pedido (el store lo elimina al llegar a 0). */
  onDecrement: () => void;
}

function StepButton({ onClick, label, danger = false, children }: {
  onClick: () => void; label: string; danger?: boolean; children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={[
        'w-11 h-11 flex items-center justify-center rounded-control border border-line bg-surface-card transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/60',
        danger
          ? 'text-red-700 dark:text-red-400 hover:bg-red-500/10 hover:border-red-500/40'
          : 'text-main hover:bg-surface-2 hover:border-line-strong',
      ].join(' ')}
    >
      {children}
    </button>
  );
}

/**
 * Línea del pedido en dos filas: nombre completo y subtotal arriba, cantidad abajo. Todo se
 * opera con el dedo: sin acciones que dependan de pasar el mouse.
 */
export function CartItem({ item, onIncrement, onDecrement }: Props) {
  const last = item.quantity === 1;

  return (
    <div className="py-3 border-b border-line last:border-0">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-body font-semibold text-main leading-snug line-clamp-2">{item.name}</p>
          <p className="text-caption text-muted">Bs {item.price.toFixed(2)} c/u</p>
        </div>
        <span className="text-body font-bold text-main whitespace-nowrap">
          Bs {(item.price * item.quantity).toFixed(2)}
        </span>
      </div>
      <div className="mt-2 flex items-center gap-1.5">
        <StepButton
          onClick={onDecrement}
          danger={last}
          label={last ? `Quitar ${item.name} del pedido` : `Quitar una unidad de ${item.name}`}
        >
          <Icon name={last ? 'trash' : 'minus'} size={18} strokeWidth={2} />
        </StepButton>
        <span className="w-9 text-center text-body font-bold text-main" aria-live="polite">{item.quantity}</span>
        <StepButton onClick={onIncrement} label={`Agregar una unidad de ${item.name}`}>
          <Icon name="plus" size={18} strokeWidth={2} />
        </StepButton>
      </div>
    </div>
  );
}
