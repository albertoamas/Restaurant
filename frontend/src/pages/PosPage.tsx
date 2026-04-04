import { useState } from 'react';
import toast from 'react-hot-toast';
import { handleApiError } from '../utils/api-error';
import type { PaymentMethod, OrderDto } from '@pos/shared';
import type { CustomerPayload } from '../components/pos/PaymentModal';
import { ordersApi } from '../api/orders.api';
import { useCartStore } from '../store/cart.store';
import { useAuth } from '../context/auth.context';
import { CategoryTabs } from '../components/pos/CategoryTabs';
import { ProductGrid } from '../components/pos/ProductGrid';
import { OrderPanel } from '../components/pos/OrderPanel';
import { PaymentModal } from '../components/pos/PaymentModal';
import { OrderSuccessModal } from '../components/pos/OrderSuccessModal';
import { printKitchenTicket } from '../utils/print';
import { useSettingsStore } from '../store/settings.store';
import { useProducts } from '../hooks/useProducts';
import { useCategories } from '../hooks/useCategories';
import { useBranches } from '../hooks/useBranches';

export function PosPage() {
  const { categories } = useCategories();
  const { products } = useProducts();
  const { branches } = useBranches();

  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [showPayment, setShowPayment] = useState(false);
  const [showCart, setShowCart] = useState(false);
  const [lastOrder, setLastOrder] = useState<OrderDto | null>(null);

  const { items, orderType, notes, addItem, getTotal, getItemCount, clear } = useCartStore();
  const { currentBranchId } = useAuth();
  const { autoPrintKitchen } = useSettingsStore();

  const currentBranch = branches.find((b) => b.id === currentBranchId);

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
    setShowPayment(true);
  };

  const handleConfirmPayment = async (method: PaymentMethod, customer: CustomerPayload) => {
    try {
      const order = await ordersApi.create({
        branchId: currentBranchId ?? undefined,
        type: orderType,
        paymentMethod: method,
        notes: notes.trim() || undefined,
        items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
        ...(customer?.customerId ? { customerId: customer.customerId } : {}),
        ...(customer?.createCustomer ? { createCustomer: customer.createCustomer } : {}),
      });
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
    <div className="flex h-[calc(100vh-3.5rem)] overflow-hidden bg-[linear-gradient(165deg,oklch(0.975_0.006_250),oklch(0.952_0.012_248))]">
      {/* Left: Products */}
      <div className="flex-1 flex flex-col p-3 sm:p-4 overflow-hidden">
        <div className="mb-3 rounded-2xl border border-white/70 bg-white/75 backdrop-blur-xl shadow-[0_8px_24px_oklch(0.13_0.012_260/0.08)] p-3 sm:p-4 animate-slide">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
            <div>
              <h2 className="font-heading text-lg sm:text-xl font-black text-gray-900 leading-tight">Punto de Venta</h2>
              <p className="text-xs text-gray-500 mt-0.5">Selecciona productos y cobra en segundos.</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary-50 border border-primary-200 text-xs font-semibold text-primary-700">
                {filteredProducts.length} productos
              </span>
              {currentBranch && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-700">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse-dot" />
                  {currentBranch.name}
                </span>
              )}
            </div>
          </div>

          <div className="relative">
            <svg
              className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none"
              fill="none" viewBox="0 0 24 24" stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M21 21l-4.35-4.35M17 11A6 6 0 105 11a6 6 0 0012 0z" />
            </svg>
            <input
              type="text"
              placeholder="Buscar producto..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-10 py-2.5 text-sm border-2 border-gray-200 rounded-2xl bg-white/95
                focus:outline-none focus:ring-[3px] focus:ring-primary-500/18 focus:border-primary-400
                transition-[border-color,box-shadow] duration-150
                shadow-[0_1px_3px_oklch(0.13_0.012_260/0.07)]"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="Limpiar búsqueda"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>

        <CategoryTabs
          categories={categories}
          selected={selectedCategory}
          onSelect={(cat) => { setSelectedCategory(cat); setSearch(''); }}
        />
        <div className="flex-1 overflow-y-auto mt-3 rounded-2xl border border-white/70 bg-white/70 backdrop-blur-md p-2 shadow-[0_6px_20px_oklch(0.13_0.012_260/0.06)]">
          <ProductGrid products={filteredProducts} onSelect={handleProductSelect} />
        </div>
      </div>

      {/* Right: Order panel (desktop) */}
      <div className="hidden lg:block w-80 border-l border-gray-200/70 bg-white/80 backdrop-blur-xl">
        <OrderPanel onCharge={handleCharge} />
      </div>

      {/* Mobile: floating cart button */}
      <div className="lg:hidden fixed bottom-20 right-4 z-30">
        {getItemCount() > 0 && (
          <button
            onClick={() => setShowCart(true)}
            className={[
              'bg-primary-600 text-white border border-primary-600',
              'rounded-2xl px-5 py-3.5 text-sm font-bold',
              'shadow-[0_3px_12px_oklch(0.45_0.16_235/0.25)]',
              'flex items-center gap-2.5',
              'hover:bg-primary-700 transition-colors',
            ].join(' ')}
          >
            <div className="relative">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
              </svg>
              <span className="absolute -top-2 -right-2 w-4 h-4 bg-white text-primary-700 text-[10px] font-black rounded-full flex items-center justify-center">
                {getItemCount()}
              </span>
            </div>
            Bs {getTotal().toFixed(2)}
          </button>
        )}
      </div>

      {/* Mobile: cart drawer */}
      {showCart && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowCart(false)} />
          <div className="absolute bottom-0 left-0 right-0 h-[82vh] rounded-t-2xl overflow-hidden animate-slide-sheet flex flex-col bg-white border-t border-gray-200/80">
            {/* Drag handle */}
            <div className="flex justify-center pt-3 pb-1 shrink-0">
              <div className="w-10 h-1 bg-gray-200 rounded-full" />
            </div>
            <div className="flex-1 min-h-0">
              <OrderPanel onCharge={handleCharge} />
            </div>
          </div>
        </div>
      )}

      <PaymentModal
        isOpen={showPayment}
        onClose={() => setShowPayment(false)}
        total={getTotal()}
        onConfirm={handleConfirmPayment}
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
