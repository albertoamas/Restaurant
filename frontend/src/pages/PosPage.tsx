import { useState } from 'react';
import toast from 'react-hot-toast';
import { useQueryClient } from '@tanstack/react-query';
import { handleApiError } from '../utils/api-error';
import type { OrderDto } from '@pos/shared';
import { PaymentMethod, OrderType } from '@pos/shared';
import type { CustomerPayload, PaymentEntry } from '../components/pos/PaymentModal';
import { ordersApi } from '../api/orders.api';
import { useCartStore } from '../store/cart.store';
import { useAuth } from '../context/auth.context';
import { useCashSessionStore } from '../store/cashSession.store';
import { CategoryTabs } from '../components/pos/CategoryTabs';
import { Icon } from '../components/ui/Icon';
import { ProductGrid } from '../components/pos/ProductGrid';
import { OrderPanel, OrderLines, OrderNote, OrderToolbar, OrderTotal, itemsLabel } from '../components/pos/OrderPanel';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { PaymentModal } from '../components/pos/PaymentModal';
import { OrderSuccessModal } from '../components/pos/OrderSuccessModal';
import { printKitchenTicket } from '../utils/print';
import { useSettingsStore } from '../store/settings.store';
import { useProducts } from '../hooks/useProducts';
import { useCategories } from '../hooks/useCategories';
import { Notice } from '../components/ui/Notice';
import { bs } from '../utils/money';
import { queryKeys } from '../lib/query-keys';

export function PosPage() {
  const queryClient = useQueryClient();
  const { categories } = useCategories();
  const { products } = useProducts();

  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [showPayment, setShowPayment] = useState(false);
  const [showCart, setShowCart] = useState(false);
  const [lastOrder, setLastOrder] = useState<OrderDto | null>(null);

  const { items, notes, addItem, getTotal, getItemCount, clear } = useCartStore();
  const itemCount = getItemCount();
  // Unidades por producto, para mostrarlas en su tarjeta del catálogo.
  const quantities = Object.fromEntries(items.map((i) => [i.productId, i.quantity]));
  const { currentBranchId, user } = useAuth();
  const { autoPrintKitchen, cashEnabled, showProductImages } = useSettingsStore();
  const { isOpen: isCashOpen } = useCashSessionStore();

  const invalidateOrderCaches = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.ordersAll });
    queryClient.invalidateQueries({ queryKey: queryKeys.kitchenOrdersAll });
  };

  const filteredProducts = products.filter((p) => {
    const matchesCategory = selectedCategory ? p.categoryId === selectedCategory : true;
    const matchesSearch = search.trim()
      ? p.name.toLowerCase().includes(search.trim().toLowerCase())
      : true;
    return matchesCategory && matchesSearch;
  });

  const handleProductSelect = (product: { id: string; name: string; price: number }) => {
    addItem({ id: product.id, name: product.name, price: product.price });
  };

  const handleCharge = () => {
    if (!currentBranchId) {
      toast.error('Selecciona una sucursal antes de crear un pedido');
      return;
    }
    setShowCart(false);
    setShowPayment(true);
  };

  const handleConfirmPayment = async (payments: PaymentEntry[], customer: CustomerPayload, orderType: OrderType) => {
    const hasCash = payments.some((p) => p.method === PaymentMethod.CASH);
    if (cashEnabled && hasCash && !isCashOpen()) {
      toast.error('No hay caja abierta. Ve a Caja y abre el turno antes de cobrar en efectivo.', { duration: 4000 });
      throw new Error('cash_session_closed');
    }
    try {
      const order = await ordersApi.create({
        branchId: currentBranchId ?? undefined,
        type: orderType,
        payments: payments.map((p) => ({ method: p.method, amount: p.amount })),
        notes: notes.trim() || undefined,
        items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
        ...(customer?.customerId ? { customerId: customer.customerId } : {}),
        ...(customer?.createCustomer ? { createCustomer: customer.createCustomer } : {}),
      });
      invalidateOrderCaches();
      clear();
      setShowPayment(false);
      setShowCart(false);
      setLastOrder(order);
      if (autoPrintKitchen) printKitchenTicket(order);
    } catch (err) {
      handleApiError(err, 'Error al crear pedido');
    }
  };

  return (
    <div className="flex h-[calc(100dvh-3.5rem)] overflow-hidden">
      {/* Catálogo */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Barra: buscador y categorías. Sin título ni tarjeta: el espacio es para productos. */}
        <div className="shrink-0 px-3 sm:px-5 pt-3 sm:pt-4 pb-3 space-y-3 border-b border-line">
          {user?.role === 'OWNER' && !currentBranchId && (
            <Notice role="alert">
              Estás viendo <strong>todas las sucursales</strong>. Elige una en el menú para poder cobrar.
            </Notice>
          )}
          <Input
            aria-label="Buscar producto"
            placeholder="Buscar producto"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            leftAddon={<Icon name="search" size={18} />}
            rightAddon={search ? (
              <button
                type="button"
                onClick={() => setSearch('')}
                aria-label="Limpiar búsqueda"
                className="w-8 h-8 -mr-1.5 flex items-center justify-center rounded-full text-muted hover:text-main hover:bg-surface-2 transition-colors"
              >
                <Icon name="x" size={16} />
              </button>
            ) : undefined}
          />
          <CategoryTabs
            categories={categories}
            selected={selectedCategory}
            onSelect={(cat) => { setSelectedCategory(cat); setSearch(''); }}
          />
        </div>

        {/* Con la barra inferior del celular visible, espacio abajo para que no tape productos. */}
        <div className={`flex-1 overflow-y-auto px-3 sm:px-5 pt-4 ${itemCount > 0 ? 'pb-28 lg:pb-5' : 'pb-5'}`}>
          <ProductGrid
            products={filteredProducts}
            onSelect={handleProductSelect}
            showImages={showProductImages}
            categories={categories}
            quantities={quantities}
          />
        </div>
      </div>

      {/* Pedido: panel lateral en escritorio */}
      <aside aria-label="Pedido" className="hidden lg:block w-[340px] xl:w-[380px] shrink-0 border-l border-line">
        <OrderPanel onCharge={handleCharge} />
      </aside>

      {/* Celular y tablet vertical: barra fija con el resumen del pedido */}
      {itemCount > 0 && (
        <div className="lg:hidden fixed bottom-0 inset-x-0 z-30 border-t border-line bg-surface-card shadow-overlay px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-caption text-soft">{itemsLabel(itemCount)}</p>
              <p className="text-heading font-bold text-main font-heading">{bs(getTotal())}</p>
            </div>
            <Button size="lg" onClick={() => setShowCart(true)}>
              <Icon name="cart" size={18} />
              Ver pedido
            </Button>
          </div>
        </div>
      )}

      <Modal
        isOpen={showCart}
        onClose={() => setShowCart(false)}
        title="Pedido"
        variant="drawer"
        footer={<OrderTotal onCharge={handleCharge} />}
      >
        <OrderToolbar />
        <OrderLines />
        <div className="pt-3 mt-1 border-t border-line">
          <OrderNote />
        </div>
      </Modal>

      <PaymentModal
        isOpen={showPayment}
        onClose={() => setShowPayment(false)}
        total={getTotal()}
        onConfirm={handleConfirmPayment}
        allowCortesia={user?.role === 'OWNER'}
        onDeferPayment={async (customer, orderType) => {
          try {
            const order = await ordersApi.create({
              branchId: currentBranchId ?? undefined,
              type: orderType,
              payments: [],
              notes: notes.trim() || undefined,
              items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
              ...(customer?.customerId ? { customerId: customer.customerId } : {}),
              ...(customer?.createCustomer ? { createCustomer: customer.createCustomer } : {}),
            });
            invalidateOrderCaches();
            clear();
            setShowPayment(false);
            setShowCart(false);
            setLastOrder(order);
            if (autoPrintKitchen) printKitchenTicket(order);
          } catch (err) {
            handleApiError(err, 'Error al crear pedido');
          }
        }}
      />

      {lastOrder && (
        <OrderSuccessModal
          isOpen
          onClose={() => setLastOrder(null)}
          order={lastOrder}
        />
      )}
    </div>
  );
}
