import { useState, useEffect } from 'react';
import { PaymentMethod, UserRole } from '@pos/shared';
import type { OrderDto } from '@pos/shared';
import { Modal } from '../ui/Modal';
import { Icon } from '../ui/Icon';
import { CategoryTabs } from '../pos/CategoryTabs';
import { ProductGrid } from '../pos/ProductGrid';
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

/* --- Payment methods ------------------------------------------------------- */

const PAYMENT_METHODS = [
  {
    value: PaymentMethod.CASH,
    label: 'Efectivo',
    cortesiaOnly: false,
    icon: <Icon name="cash" size={24} strokeWidth={1.5} />,
    idle:   'border-2 border-[var(--border-subtle)] bg-[var(--color-surface-2)] text-gray-500 hover:border-emerald-400/50 hover:bg-emerald-500/10 hover:text-emerald-400',
    active: 'border-2 border-emerald-500/70 bg-emerald-500/18 text-emerald-600',
  },
  {
    value: PaymentMethod.QR,
    label: 'QR',
    cortesiaOnly: false,
    icon: <Icon name="qr" size={24} strokeWidth={1.5} />,
    idle:   'border-2 border-[var(--border-subtle)] bg-[var(--color-surface-2)] text-gray-500 hover:border-primary-400/50 hover:bg-primary-500/10 hover:text-primary-400',
    active: 'border-2 border-primary-500/70 bg-primary-500/18 text-primary-600',
  },
  {
    value: PaymentMethod.TRANSFER,
    label: 'Transferencia',
    cortesiaOnly: false,
    icon: <Icon name="card" size={24} strokeWidth={1.5} />,
    idle:   'border-2 border-[var(--border-subtle)] bg-[var(--color-surface-2)] text-gray-500 hover:border-violet-400/50 hover:bg-violet-500/10 hover:text-violet-400',
    active: 'border-2 border-violet-500/70 bg-violet-500/18 text-violet-600',
  },
  {
    value: PaymentMethod.CORTESIA,
    label: 'Cortesia',
    cortesiaOnly: true,
    icon: <Icon name="gift" size={24} strokeWidth={1.5} />,
    idle:   'border-2 border-[var(--border-subtle)] bg-[var(--color-surface-2)] text-gray-500 hover:border-amber-400/50 hover:bg-amber-500/10 hover:text-amber-400',
    active: 'border-2 border-amber-500/70 bg-amber-500/18 text-amber-600',
  },
];

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

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((i) => i.productId !== productId));
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
      handleApiError(err, 'Error al anadir productos');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Anadir productos - Pedido #${order.orderNumber}`} size="4xl">
      {/*
        Two-column grid on large screens.
        -mx-6 -mb-5 cancels the Modal's own px-6 py-5 padding so columns reach the edges cleanly.
        overflow-hidden on each column prevents content from spilling out.
      */}
      <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] -mx-6 -mb-5 divide-y lg:divide-y-0 lg:divide-x divide-[var(--border-subtle)]">

        {/* ====== LEFT — product selector ====== */}
        <div className="flex flex-col gap-3 px-6 py-4 overflow-hidden">

          {/* Search */}
          <div className="relative">
            <Icon name="search" size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Buscar producto..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-9 py-2.5 text-sm border border-[var(--border-subtle)] rounded-2xl bg-[var(--color-surface-2)] text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-[3px] focus:ring-primary-500/20 focus:border-primary-500/50 transition-[border-color,box-shadow]"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                aria-label="Limpiar"
              >
                <Icon name="x" size={14} />
              </button>
            )}
          </div>

          {/* Category tabs — horizontal scroll contained */}
          <div className="overflow-x-auto">
            <CategoryTabs
              categories={categories}
              selected={selectedCategory}
              onSelect={(c) => { setSelectedCategory(c); setSearch(''); }}
            />
          </div>

          {/* Product grid — fixed height, internal scroll only */}
          <div
            className="overflow-y-auto overflow-x-hidden rounded-2xl border border-[var(--border-subtle)] p-2"
            style={{ background: 'var(--color-surface-2)', height: '380px' }}
          >
            <ProductGrid products={filteredProducts} onSelect={addToCart} showImages={showProductImages} />
          </div>
        </div>

        {/* ====== RIGHT — cart + summary + action ====== */}
        <div className="flex flex-col gap-4 px-6 py-4 overflow-hidden">

          {/* Cart list */}
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
              Productos a anadir
            </p>
            {cartEmpty ? (
              <div className="flex flex-col items-center justify-center py-8 rounded-2xl border-2 border-dashed border-[var(--border-subtle)] text-gray-400">
                <Icon name="cart" size={28} strokeWidth={1.5} className="mb-2 opacity-50" />
                <p className="text-sm">Selecciona productos de la izquierda</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[180px] overflow-y-auto overflow-x-hidden pr-1">
                {cart.map((item) => (
                  <div
                    key={item.productId}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[var(--color-surface-2)] border border-[var(--border-subtle)] min-w-0"
                  >
                    <span className="flex-1 text-sm font-semibold text-gray-800 truncate min-w-0">{item.name}</span>

                    {/* Qty controls */}
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => decrementCart(item.productId)}
                        className="w-6 h-6 rounded-lg bg-[var(--color-surface-card)] border border-[var(--border-subtle)] flex items-center justify-center text-gray-500 hover:text-red-500 hover:border-red-300 transition-colors"
                        aria-label="Quitar"
                      >
                        <Icon name="minus" size={12} strokeWidth={2.5} />
                      </button>
                      <span className="w-6 text-center text-sm font-bold text-gray-800 tabular-nums">{item.quantity}</span>
                      <button
                        onClick={() => incrementCart(item.productId)}
                        className="w-6 h-6 rounded-lg bg-[var(--color-surface-card)] border border-[var(--border-subtle)] flex items-center justify-center text-gray-500 hover:text-emerald-500 hover:border-emerald-300 transition-colors"
                        aria-label="Agregar"
                      >
                        <Icon name="plus" size={12} strokeWidth={2.5} />
                      </button>
                    </div>

                    <span className="text-sm font-bold text-gray-800 tabular-nums shrink-0 w-14 text-right">
                      Bs {(item.price * item.quantity).toFixed(2)}
                    </span>

                    <button
                      onClick={() => removeFromCart(item.productId)}
                      className="w-5 h-5 rounded-full bg-[var(--border-subtle)] hover:bg-red-500/60 flex items-center justify-center text-gray-500 hover:text-white transition-colors shrink-0"
                      aria-label="Eliminar"
                    >
                      <Icon name="x" size={10} strokeWidth={3} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Totals */}
          {!cartEmpty && (
            <div className="rounded-2xl border border-[var(--border-subtle)] divide-y divide-[var(--border-subtle)] overflow-hidden">
              <div className="flex justify-between items-center px-4 py-2 bg-[var(--color-surface-2)]">
                <span className="text-xs text-gray-500 font-medium">Total actual</span>
                <span className="text-sm font-bold text-gray-700 tabular-nums">Bs {order.total.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center px-4 py-2 bg-[var(--color-surface-2)]">
                <span className="text-xs text-gray-500 font-medium">
                  {needsPayment ? 'A cobrar ahora' : 'Subtotal adicional'}
                </span>
                <span className="text-sm font-semibold text-primary-600 tabular-nums">+ Bs {cartTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center px-4 py-2.5">
                <span className="text-sm font-bold text-gray-700">Nuevo total</span>
                <span className="font-heading font-black text-xl text-gray-900 tabular-nums">Bs {newOrderTotal.toFixed(2)}</span>
              </div>
            </div>
          )}

          {/* Payment method — only when already paid */}
          {needsPayment && !cartEmpty && (
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                Cobrar diferencia - Bs {cartTotal.toFixed(2)}
              </p>
              <div className={`grid gap-2 ${availableMethods.length === 4 ? 'grid-cols-2' : 'grid-cols-3'}`}>
                {availableMethods.map((m) => (
                  <button
                    key={m.value}
                    onClick={() => setSelectedMethod(m.value)}
                    className={[
                      'flex flex-col items-center gap-1.5 py-3 px-2 rounded-2xl transition-all duration-150',
                      selectedMethod === m.value ? m.active : m.idle,
                    ].join(' ')}
                  >
                    {m.icon}
                    <span className="text-xs font-semibold">{m.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Info — not yet paid */}
          {!needsPayment && !cartEmpty && (
            <div className="flex items-start gap-2.5 px-3 py-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20">
              <Icon name="warning" size={15} strokeWidth={2} className="text-amber-600 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-700 leading-relaxed">
                Pedido sin cobrar. Todo se cobrara junto al final.
              </p>
            </div>
          )}

          {/* Spacer so CTA stays at bottom */}
          <div className="flex-1" />

          {/* CTA */}
          <button
            id="add-items-confirm-btn"
            onClick={handleConfirm}
            disabled={!canConfirm}
            className={[
              'w-full py-3.5 rounded-2xl text-base font-bold transition-all duration-200',
              canConfirm
                ? 'bg-primary-600 hover:bg-primary-700 text-white shadow-[0_4px_16px_oklch(0.60_0.22_42/0.30)] active:scale-[0.98]'
                : 'bg-[var(--color-surface-2)] text-gray-400 cursor-not-allowed',
            ].join(' ')}
          >
            {loading
              ? 'Procesando...'
              : cartEmpty
                ? 'Selecciona al menos un producto'
                : needsPayment && !selectedMethod
                  ? 'Elige metodo de pago'
                  : `Anadir al pedido - Bs ${cartTotal.toFixed(2)}`}
          </button>
        </div>
      </div>
    </Modal>
  );
}
