import { OrderType } from '@pos/shared';
import { useCartStore } from '../../store/cart.store';
import { CartItem } from './CartItem';
import { Button } from '../ui/Button';

interface Props {
  onCharge: () => void;
}

const orderTypes = [
  {
    value: OrderType.DINE_IN,
    label: 'Local',
    icon: (
      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
      </svg>
    ),
  },
  {
    value: OrderType.TAKEOUT,
    label: 'Llevar',
    icon: (
      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
      </svg>
    ),
  },
  {
    value: OrderType.DELIVERY,
    label: 'Delivery',
    icon: (
      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
      </svg>
    ),
  },
];

export function OrderPanel({ onCharge }: Props) {
  const { items, orderType, notes, setOrderType, setNotes, incrementItem, decrementItem, removeItem, getTotal, getItemCount, clear } =
    useCartStore();

  const total = getTotal();
  const count = getItemCount();

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Order type selector */}
      <div className="p-3 border-b border-gray-100">
        <div className="flex gap-0.5 border border-gray-200 rounded-xl p-0.5 bg-gray-50">
          {orderTypes.map((type) => (
            <button
              key={type.value}
              onClick={() => setOrderType(type.value)}
              className={[
                'flex-1 flex items-center justify-center gap-1.5 py-2 rounded-[10px] text-xs font-semibold transition-all duration-150',
                orderType === type.value
                  ? 'bg-white text-gray-900 shadow-[0_1px_3px_oklch(0.13_0.012_260/0.10)] border border-gray-100'
                  : 'text-gray-500 hover:text-gray-700',
              ].join(' ')}
            >
              {type.icon}
              {type.label}
            </button>
          ))}
        </div>
      </div>

      {/* Cart header */}
      <div className="flex items-center justify-between px-3 pt-3 pb-1">
        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.1em]">
          Pedido {count > 0 && `· ${count} ítem${count !== 1 ? 's' : ''}`}
        </span>
        {items.length > 0 && (
          <button
            onClick={clear}
            className="text-[11px] text-gray-400 hover:text-red-500 font-medium transition-colors"
          >
            Limpiar
          </button>
        )}
      </div>

      {/* Cart items */}
      <div className="flex-1 overflow-y-auto px-3">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-300 gap-2 py-8">
            <svg className="w-14 h-14 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
            </svg>
            <p className="text-sm text-gray-400">Selecciona productos</p>
          </div>
        ) : (
          items.map((item) => (
            <CartItem
              key={item.productId}
              item={item}
              onIncrement={() => incrementItem(item.productId)}
              onDecrement={() => decrementItem(item.productId)}
              onRemove={() => removeItem(item.productId)}
            />
          ))
        )}
      </div>

      {/* Notes */}
      <div className="px-3 py-2 border-t border-gray-100">
        <textarea
          rows={2}
          placeholder="Notas (ej: sin cebolla, mesa 5...)"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 resize-none bg-gray-50
            placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400
            transition-[border-color,box-shadow] duration-150"
        />
      </div>

      {/* Footer */}
      <div className="px-3 pb-3 pt-1 space-y-3">
        <div className="flex items-baseline justify-between">
          <span className="text-sm font-semibold text-gray-500">Total</span>
          <span className="font-heading font-black text-3xl text-gray-900">
            Bs {total.toFixed(2)}
          </span>
        </div>
        <Button
          variant="emerald"
          size="xl"
          fullWidth
          disabled={items.length === 0}
          onClick={onCharge}
        >
          {items.length === 0
            ? 'Cobrar'
            : `Cobrar · Bs ${total.toFixed(2)}`}
        </Button>
      </div>
    </div>
  );
}
