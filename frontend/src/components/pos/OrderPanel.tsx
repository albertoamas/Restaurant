import { useEffect, useState } from 'react';
import { useCartStore } from '../../store/cart.store';
import { CartItem } from './CartItem';
import { Button } from '../ui/Button';
import { Icon } from '../ui/Icon';
import { Textarea } from '../ui/Input';
import { EmptyState } from '../ui/EmptyState';
import { bs } from '../../utils/money';

/*
 * Piezas del pedido en curso. El panel lateral (escritorio) y la hoja del carrito (celular y
 * tablet vertical) usan las mismas, así los dos muestran exactamente lo mismo.
 */

export const itemsLabel = (count: number) => `${count} producto${count !== 1 ? 's' : ''}`;

/** "3 productos" y la acción de vaciar el pedido. */
export function OrderToolbar() {
  const { items, clear, getItemCount } = useCartStore();
  const count = getItemCount();
  return (
    <div className="flex items-center justify-between gap-3 min-h-9">
      <span className="text-label text-soft">{count > 0 ? itemsLabel(count) : 'Sin productos'}</span>
      {items.length > 0 && (
        <button
          type="button"
          onClick={clear}
          className="inline-flex items-center gap-1.5 min-h-9 px-2.5 -mr-2.5 rounded-control text-label font-semibold text-red-700 dark:text-red-400 hover:bg-red-500/10 transition-colors"
        >
          <Icon name="trash" size={15} strokeWidth={2} />
          Vaciar
        </button>
      )}
    </div>
  );
}

export function OrderLines() {
  const { items, incrementItem, decrementItem } = useCartStore();
  if (items.length === 0) {
    return <EmptyState compact icon="cart" title="Pedido vacío" description="Toca un producto para agregarlo." />;
  }
  return (
    <div>
      {items.map((item) => (
        <CartItem
          key={item.productId}
          item={item}
          onIncrement={() => incrementItem(item.productId)}
          onDecrement={() => decrementItem(item.productId)}
        />
      ))}
    </div>
  );
}

/** Nota del pedido, plegada hasta que se necesita (casi nunca se usa). Si hay nota, se ve. */
export function OrderNote() {
  const { items, notes, setNotes } = useCartStore();
  const [expanded, setExpanded] = useState(false);

  // Al vaciarse el pedido la nota se borra (clear()); se vuelve a plegar.
  useEffect(() => { if (items.length === 0) setExpanded(false); }, [items.length]);

  if (!expanded && !notes) {
    return (
      <button
        type="button"
        onClick={() => setExpanded(true)}
        className="inline-flex items-center gap-2 min-h-10 px-2 -mx-2 rounded-control text-label font-semibold text-soft hover:text-main hover:bg-surface-2 transition-colors"
      >
        <Icon name="chat" size={16} />
        Agregar nota
      </button>
    );
  }
  return (
    <Textarea
      label="Nota del pedido"
      rows={2}
      autoFocus={expanded && !notes}
      placeholder="Ej.: sin cebolla, mesa 5"
      value={notes}
      onChange={(e) => setNotes(e.target.value)}
    />
  );
}

/** Total del pedido (una sola vez) y la acción de cobrar. */
export function OrderTotal({ onCharge }: { onCharge: () => void }) {
  const { items, getTotal } = useCartStore();
  return (
    <div className="space-y-3">
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-label font-semibold text-soft">Total</span>
        <span className="text-display font-bold text-main font-heading">{bs(getTotal())}</span>
      </div>
      <Button variant="success" size="xl" fullWidth disabled={items.length === 0} onClick={onCharge}>
        Cobrar
      </Button>
    </div>
  );
}

/** Panel lateral del pedido (lg+). */
export function OrderPanel({ onCharge }: { onCharge: () => void }) {
  return (
    <div className="flex flex-col h-full bg-surface-card">
      <div className="px-5 pt-4 pb-2 shrink-0">
        <h2 className="text-heading font-semibold text-main font-heading">Pedido</h2>
        <OrderToolbar />
      </div>
      <div className="flex-1 overflow-y-auto px-5">
        <OrderLines />
      </div>
      <div className="px-5 py-3 border-t border-line shrink-0">
        <OrderNote />
      </div>
      <div className="px-5 pt-3 pb-5 border-t border-line shrink-0">
        <OrderTotal onCharge={onCharge} />
      </div>
    </div>
  );
}
