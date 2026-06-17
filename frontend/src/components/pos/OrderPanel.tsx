import { useCartStore } from '../../store/cart.store';
import { CartItem } from './CartItem';
import { Button } from '../ui/Button';
import { Icon } from '../ui/Icon';

interface Props {
  onCharge: () => void;
  onClose?: () => void;
}

export function OrderPanel({ onCharge, onClose }: Props) {
  const { items, notes, setNotes, incrementItem, decrementItem, removeItem, getTotal, getItemCount, clear } =
    useCartStore();

  const total = getTotal();
  const count = getItemCount();

  return (
    <div className="flex flex-col h-full" style={{ background: 'var(--color-surface-card)' }}>
      {/* Header — solo en drawer mobile */}
      {onClose && (
        <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-[var(--border-subtle)] shrink-0">
          <div>
            <h3 className="font-heading font-black text-base text-gray-800 leading-tight">Tu pedido</h3>
            <p className="text-xs text-gray-500 mt-0.5">
              {count > 0 ? `${count} ítem${count !== 1 ? 's' : ''}` : 'Sin productos aún'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-[var(--color-surface-2)] hover:bg-[var(--color-surface-3)] text-gray-500 hover:text-gray-700 transition-colors"
            aria-label="Cerrar carrito"
          >
            <Icon name="x" size={18} strokeWidth={2} />
          </button>
        </div>
      )}

      {/* Cart sub-header */}
      <div className="flex items-center justify-between px-4 pt-3 pb-1.5 shrink-0">
        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
          {!onClose && (count > 0 ? `Pedido · ${count} ítem${count !== 1 ? 's' : ''}` : 'Pedido')}
        </span>
        {items.length > 0 && (
          <button
            onClick={clear}
            className="flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-semibold text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors"
          >
            <Icon name="trash" size={12} strokeWidth={2} />
            Limpiar
          </button>
        )}
      </div>

      {/* Cart items */}
      <div className="flex-1 overflow-y-auto px-3">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500 gap-3 py-10">
            <div className="w-16 h-16 rounded-2xl bg-[var(--color-surface-2)] border border-[var(--border-subtle)] flex items-center justify-center">
              <Icon name="cart" size={32} strokeWidth={1} className="opacity-30" />
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-gray-500">Carrito vacío</p>
              <p className="text-xs text-gray-400 mt-0.5">Selecciona productos del catálogo</p>
            </div>
          </div>
        ) : (
          <div className="space-y-0.5 py-1">
            {items.map((item) => (
              <CartItem
                key={item.productId}
                item={item}
                onIncrement={() => incrementItem(item.productId)}
                onDecrement={() => decrementItem(item.productId)}
                onRemove={() => removeItem(item.productId)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Notes */}
      <div className="px-4 py-2.5 border-t border-[var(--border-subtle)] shrink-0">
        <textarea
          rows={2}
          placeholder="Notas: sin cebolla, mesa 5..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="w-full text-sm border border-[var(--border-subtle)] rounded-xl px-3 py-2 resize-none bg-[var(--color-surface-card)]
            placeholder:text-gray-400 text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500/50
            transition-[border-color,box-shadow] duration-150"
        />
      </div>

      {/* Footer total + cobrar */}
      <div className="px-4 pb-4 pt-3 shrink-0 space-y-3 border-t border-[var(--border-subtle)]">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total</span>
          <div className="text-right">
            <span className="font-heading font-black text-3xl text-gray-800 leading-none">
              Bs {total.toFixed(2)}
            </span>
          </div>
        </div>
        <Button
          variant="emerald"
          size="xl"
          fullWidth
          disabled={items.length === 0}
          onClick={onCharge}
        >
          {items.length === 0 ? 'Cobrar' : `Cobrar · Bs ${total.toFixed(2)}`}
        </Button>
      </div>
    </div>
  );
}
