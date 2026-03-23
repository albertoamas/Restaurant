import type { CartItem as CartItemType } from '../../store/cart.store';

interface Props {
  item: CartItemType;
  onIncrement: () => void;
  onDecrement: () => void;
  onRemove: () => void;
}

export function CartItem({ item, onIncrement, onDecrement, onRemove }: Props) {
  return (
    <div className="flex items-center gap-2 py-2 border-b border-gray-100 last:border-0">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-800 truncate">{item.name}</p>
        <p className="text-xs text-gray-500">S/ {item.price.toFixed(2)} c/u</p>
      </div>

      <div className="flex items-center gap-1">
        <button
          onClick={onDecrement}
          className="w-7 h-7 flex items-center justify-center rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold text-sm"
        >
          -
        </button>
        <span className="w-8 text-center text-sm font-semibold">{item.quantity}</span>
        <button
          onClick={onIncrement}
          className="w-7 h-7 flex items-center justify-center rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold text-sm"
        >
          +
        </button>
      </div>

      <span className="text-sm font-semibold text-gray-800 w-16 text-right">
        S/ {(item.price * item.quantity).toFixed(2)}
      </span>

      <button
        onClick={onRemove}
        className="p-1 rounded hover:bg-red-50 text-gray-400 hover:text-red-500"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}
