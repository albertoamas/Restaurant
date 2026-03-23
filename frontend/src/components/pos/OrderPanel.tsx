import { OrderType } from '@pos/shared';
import { useCartStore } from '../../store/cart.store';
import { CartItem } from './CartItem';
import { Button } from '../ui/Button';

interface Props {
  onCharge: () => void;
}

const orderTypes = [
  { value: OrderType.DINE_IN, label: 'Local' },
  { value: OrderType.TAKEOUT, label: 'Para Llevar' },
  { value: OrderType.DELIVERY, label: 'Delivery' },
];

export function OrderPanel({ onCharge }: Props) {
  const { items, orderType, setOrderType, incrementItem, decrementItem, removeItem, getTotal, clear } =
    useCartStore();

  const total = getTotal();

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Order type selector */}
      <div className="p-3 border-b border-gray-100">
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
          {orderTypes.map((type) => (
            <button
              key={type.value}
              onClick={() => setOrderType(type.value)}
              className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors ${
                orderType === type.value
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {type.label}
            </button>
          ))}
        </div>
      </div>

      {/* Cart items */}
      <div className="flex-1 overflow-y-auto p-3">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <svg className="w-12 h-12 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
            </svg>
            <p className="text-sm">Selecciona productos</p>
          </div>
        ) : (
          <>
            {items.map((item) => (
              <CartItem
                key={item.productId}
                item={item}
                onIncrement={() => incrementItem(item.productId)}
                onDecrement={() => decrementItem(item.productId)}
                onRemove={() => removeItem(item.productId)}
              />
            ))}
          </>
        )}
      </div>

      {/* Footer: total + charge */}
      <div className="p-3 border-t border-gray-200 space-y-3">
        {items.length > 0 && (
          <button
            onClick={clear}
            className="text-xs text-red-500 hover:text-red-700 font-medium"
          >
            Limpiar pedido
          </button>
        )}
        <div className="flex items-center justify-between">
          <span className="text-lg font-bold text-gray-900">Total</span>
          <span className="text-2xl font-bold text-gray-900">S/ {total.toFixed(2)}</span>
        </div>
        <Button
          size="lg"
          fullWidth
          disabled={items.length === 0}
          onClick={onCharge}
          className="!bg-emerald-600 hover:!bg-emerald-700"
        >
          Cobrar S/ {total.toFixed(2)}
        </Button>
      </div>
    </div>
  );
}
