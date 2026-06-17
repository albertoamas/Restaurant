import { Icon } from '../ui/Icon';
import type { CartItem as CartItemType } from '../../store/cart.store';

interface Props {
  item: CartItemType;
  onIncrement: () => void;
  onDecrement: () => void;
  onRemove: () => void;
}

export function CartItem({ item, onIncrement, onDecrement, onRemove }: Props) {
  return (
    <div className="group flex items-center gap-2 py-2.5 border-b border-[var(--border-subtle)] last:border-0">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-700 truncate">{item.name}</p>
        <p className="text-xs text-gray-500">Bs {item.price.toFixed(2)} c/u</p>
      </div>

      <div className="flex items-center gap-1">
        <button
          onClick={onDecrement}
          className="w-8 h-8 flex items-center justify-center rounded-lg border border-[var(--border-subtle)] bg-[var(--color-surface-2)] hover:border-primary-500/40 hover:bg-primary-500/10 text-gray-500 hover:text-primary-400 font-bold text-sm transition-colors"
        >
          −
        </button>
        <span className="w-7 text-center text-sm font-bold text-gray-700">{item.quantity}</span>
        <button
          onClick={onIncrement}
          className="w-8 h-8 flex items-center justify-center rounded-lg border border-[var(--border-subtle)] bg-[var(--color-surface-2)] hover:border-primary-500/40 hover:bg-primary-500/10 text-gray-500 hover:text-primary-400 font-bold text-sm transition-colors"
        >
          +
        </button>
      </div>

      <span className="font-heading font-bold text-sm text-gray-700 w-16 text-right">
        Bs {(item.price * item.quantity).toFixed(2)}
      </span>

      <button
        onClick={onRemove}
        aria-label="Quitar del carrito"
        className="p-1 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-all duration-150"
      >
        <Icon name="x" size={16} strokeWidth={2} />
      </button>
    </div>
  );
}
