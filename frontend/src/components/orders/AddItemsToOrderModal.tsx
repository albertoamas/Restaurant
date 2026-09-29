import { useState, useEffect, useMemo } from 'react';
import { PaymentMethod, UserRole } from '@pos/shared';
import type { OrderDto } from '@pos/shared';
import { Modal } from '../ui/Modal';
import { Icon } from '../ui/Icon';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { EmptyState } from '../ui/EmptyState';
import { CategoryTabs } from '../pos/CategoryTabs';
import { ProductGrid } from '../pos/ProductGrid';
import { CartItem } from '../pos/CartItem';
import { PAYMENT_METHODS, optionClass } from '../pos/PaymentMethodSection';
import { ordersApi } from '../../api/orders.api';
import { handleApiError } from '../../utils/api-error';
import { useProducts } from '../../hooks/useProducts';
import { useCategories } from '../../hooks/useCategories';
import { useAuth } from '../../context/auth.context';
import { useSettingsStore } from '../../store/settings.store';

/* --- Types ---------------------------------------------------------------- */

interface CartEntry {
  productId: string;
  name: string;
  price: number;
  quantity: number;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  order: OrderDto;
  onUpdated: (order: OrderDto) => void;
}

/* --- Component ------------------------------------------------------------ */

export function AddItemsToOrderModal({ isOpen, onClose, order, onUpdated }: Props) {
  const { user } = useAuth();
  const allowCortesia = user?.role === UserRole.OWNER;
  const { showProductImages } = useSettingsStore();

  const { categories } = useCategories();
  const { products }   = useProducts();

  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [search, setSearch]                     = useState('');
  const [cart, setCart]                         = useState<CartEntry[]>([]);
  const [selectedMethod, setSelectedMethod]     = useState<PaymentMethod | null>(null);
  const [loading, setLoading]                   = useState(false);

  // Reset when modal opens
  useEffect(() => {
    if (isOpen) {
      setCart([]);
      setSelectedCategory(null);
      setSearch('');
      setSelectedMethod(null);
    }
  }, [isOpen]);

  const filteredProducts = products.filter((p) => {
    const matchCat    = selectedCategory ? p.categoryId === selectedCategory : true;
    const matchSearch = search.trim()
      ? p.name.toLowerCase().includes(search.trim().toLowerCase())
      : true;
    return matchCat && matchSearch;
  });

  const addToCart = (product: { id: string; name: string; price: number }) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.productId === product.id);
      if (existing) {
        return prev.map((i) =>
          i.productId === product.id ? { ...i, quantity: i.quantity + 1 } : i,
        );
      }
      return [...prev, { productId: product.id, name: product.name, price: product.price, quantity: 1 }];
    });
  };

  const incrementCart = (productId: string) => {
    setCart((prev) =>
      prev.map((i) => (i.productId === productId ? { ...i, quantity: i.quantity + 1 } : i)),
    );
  };

  const decrementCart = (productId: string) => {
    setCart((prev) => {
      const item = prev.find((i) => i.productId === productId);
      if (item && item.quantity <= 1) return prev.filter((i) => i.productId !== productId);
      return prev.map((i) => (i.productId === productId ? { ...i, quantity: i.quantity - 1 } : i));
    });
  };

  const cartTotal     = Math.round(cart.reduce((s, i) => s + i.price * i.quantity, 0) * 100) / 100;
  const newOrderTotal = Math.round((order.total + cartTotal) * 100) / 100;
  const cartEmpty     = cart.length === 0;

  const needsPayment = order.isPaid;
  const canConfirm   = !cartEmpty && (!needsPayment || selectedMethod !== null) && !loading;

  const availableMethods = PAYMENT_METHODS.filter((m) => !m.cortesiaOnly || allowCortesia);
  const quantities = useMemo(() => Object.fromEntries(cart.map((i) => [i.productId, i.quantity])), [cart]);

  const handleConfirm = async () => {
    if (!canConfirm) return;
    setLoading(true);
    try {
      const updated = await ordersApi.addItems(order.id, {
        items: cart.map((i) => ({ productId: i.productId, quantity: i.quantity })),
        ...(needsPayment && selectedMethod
          ? { payment: { method: selectedMethod, amount: cartTotal } }
          : {}),
      });
      onUpdated(updated);
      onClose();
    } catch (err) {
      handleApiError(err, 'Error al añadir productos');
    } finally {
      setLoading(false);
    }
  };

  const ctaLabel = loading
    ? 'Añadiendo'
    : cartEmpty
      ? 'Elige al menos un producto'
      : needsPayment && !selectedMethod
        ? 'Elige cómo se cobra'
        : `Añadir al pedido: Bs ${cartTotal.toFixed(2)}`;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Añadir productos al pedido #${order.orderNumber}`} size="4xl">
      {/* -mx-6 -mb-5 anula el relleno del Modal para que las columnas lleguen al borde. */}
      <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] -mx-6 -mb-5 divide-y lg:divide-y-0 lg:divide-x divide-line">

        {/* Catálogo */}
        <div className="flex flex-col gap-3 px-6 py-4 min-w-0">
          <Input
            aria-label="Buscar producto"
            placeholder="Buscar producto"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            leftAddon={<Icon name="search" size={18} />}
            rightAddon={search ? (
              <button type="button" onClick={() => setSearch('')} aria-label="Limpiar búsqueda" className="p-1 text-muted hover:text-main">
                <Icon name="x" size={16} />
              </button>
            ) : undefined}
          />
          <CategoryTabs
            categories={categories}
            selected={selectedCategory}
            onSelect={(c) => { setSelectedCategory(c); setSearch(''); }}
          />
          <div className="h-[380px] overflow-y-auto overflow-x-hidden rounded-card border border-line bg-surface-2 p-2">
            <ProductGrid
              products={filteredProducts}
              onSelect={addToCart}
              showImages={showProductImages}
              categories={categories}
              quantities={quantities}
            />
          </div>
        </div>

        {/* Lo que se añade */}
        <div className="flex flex-col gap-4 px-6 py-4 min-w-0">
          <div>
            <p className="text-label font-semibold text-soft mb-1">Productos a añadir</p>
            {cartEmpty ? (
              <EmptyState compact icon="cart" title="Nada por añadir" description="Toca un producto del catálogo para sumarlo al pedido." />
            ) : (
              <div className="max-h-[220px] overflow-y-auto overflow-x-hidden pr-1">
                {cart.map((item) => (
                  <CartItem
                    key={item.productId}
                    item={item}
                    onIncrement={() => incrementCart(item.productId)}
                    onDecrement={() => decrementCart(item.productId)}
                  />
                ))}
              </div>
            )}
          </div>

          {!cartEmpty && (
            <dl className="rounded-card border border-line bg-surface-2 px-4 py-3 space-y-1.5">
              <div className="flex justify-between text-label text-soft">
                <dt>Total actual</dt>
                <dd className="tabular-nums">Bs {order.total.toFixed(2)}</dd>
              </div>
              <div className="flex justify-between text-label text-soft">
                <dt>{needsPayment ? 'A cobrar ahora' : 'Se suma'}</dt>
                <dd className="tabular-nums font-semibold text-main">Bs {cartTotal.toFixed(2)}</dd>
              </div>
              <div className="flex justify-between items-baseline pt-1.5 border-t border-line">
                <dt className="text-body font-semibold text-main">Nuevo total</dt>
                <dd className="text-heading font-bold text-main tabular-nums">Bs {newOrderTotal.toFixed(2)}</dd>
              </div>
            </dl>
          )}

          {/* Pedido ya cobrado: la diferencia se cobra ahora. */}
          {needsPayment && !cartEmpty && (
            <div>
              <p className="text-label font-semibold text-soft mb-2">Cobrar la diferencia de Bs {cartTotal.toFixed(2)}</p>
              <div role="radiogroup" aria-label="Método de pago" className={`grid gap-2 ${availableMethods.length === 4 ? 'grid-cols-2' : 'grid-cols-3'}`}>
                {availableMethods.map((m) => (
                  <button
                    key={m.value}
                    type="button"
                    role="radio"
                    aria-checked={selectedMethod === m.value}
                    onClick={() => setSelectedMethod(m.value)}
                    className={`${optionClass(selectedMethod === m.value)} min-h-18 py-3 px-2`}
                  >
                    <Icon name={m.icon} size={20} strokeWidth={1.75} />
                    <span className="text-label font-semibold">{m.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {!needsPayment && !cartEmpty && (
            <p className="flex items-start gap-2 rounded-control border border-amber-500/30 bg-amber-500/10 px-3 py-2.5 text-label text-amber-800 dark:text-amber-300">
              <Icon name="warning" size={16} strokeWidth={2} className="shrink-0 mt-0.5" />
              El pedido está sin cobrar: todo se cobra junto al final.
            </p>
          )}

          <div className="flex-1" />

          <Button id="add-items-confirm-btn" size="lg" fullWidth onClick={handleConfirm} disabled={!canConfirm} loading={loading}>
            {ctaLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
