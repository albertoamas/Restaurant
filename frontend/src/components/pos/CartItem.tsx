import type { CartItem as CartItemType } from '../../store/cart.store';

interface Props {
  item: CartItemType;
  onIncrement: () => void;
  onDecrement: () => void;
  onRemove: () => void;
}

export function CartItem({ item, onIncrement, onDecrement, onRemove }: Props) {
  return (
    <div className="group flex items-center gap-2 py-2.5 border-b border-gray-100 last:border-0">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-800 truncate">{item.name}</p>
        <p className="text-xs text-gray-400">Bs {item.price.toFixed(2)} c/u</p>
      </div>

      <div className="flex items-center gap-1">
        <button
          onClick={onDecrement}
          className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 bg-white hover:border-primary-300 hover:bg-primary-50 text-gray-600 font-bold text-sm transition-colors"
        >
          −
        </button>
        <span className="w-7 text-center text-sm font-bold text-gray-900">{item.quantity}</span>
        <button
          onClick={onIncrement}
          className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 bg-white hover:border-primary-300 hover:bg-primary-50 text-gray-600 font-bold text-sm transition-colors"
        >
          +
        </button>
      </div>

      <span className="font-heading font-bold text-sm text-gray-900 w-16 text-right">
        Bs {(item.price * item.quantity).toFixed(2)}
      </span>

      <button
        onClick={onRemove}
        className="p-1 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all duration-150"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}
