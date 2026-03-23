import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import type { CategoryDto, ProductDto, PaymentMethod } from '@pos/shared';
import { categoriesApi } from '../api/categories.api';
import { productsApi } from '../api/products.api';
import { ordersApi } from '../api/orders.api';
import { useCartStore } from '../store/cart.store';
import { CategoryTabs } from '../components/pos/CategoryTabs';
import { ProductGrid } from '../components/pos/ProductGrid';
import { OrderPanel } from '../components/pos/OrderPanel';
import { PaymentModal } from '../components/pos/PaymentModal';

export function PosPage() {
  const [categories, setCategories] = useState<CategoryDto[]>([]);
  const [products, setProducts] = useState<ProductDto[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showPayment, setShowPayment] = useState(false);
  const [showCart, setShowCart] = useState(false);

  const { items, orderType, addItem, getTotal, getItemCount, clear } = useCartStore();

  useEffect(() => {
    categoriesApi.getAll().then(setCategories).catch(() => {});
    productsApi.getAll().then(setProducts).catch(() => {});
  }, []);

  const filteredProducts = selectedCategory
    ? products.filter((p) => p.categoryId === selectedCategory)
    : products;

  const handleProductSelect = (product: ProductDto) => {
    addItem({ id: product.id, name: product.name, price: product.price });
  };

  const handleCharge = () => {
    setShowPayment(true);
  };

  const handleConfirmPayment = async (method: PaymentMethod) => {
    try {
      const order = await ordersApi.create({
        type: orderType,
        paymentMethod: method,
        items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
      });
      toast.success(`Pedido #${order.orderNumber} creado`);
      clear();
      setShowPayment(false);
      setShowCart(false);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error al crear pedido');
    }
  };

  return (
    <div className="flex h-[calc(100vh-3.5rem)] overflow-hidden">
      {/* Left: Products */}
      <div className="flex-1 flex flex-col p-4 overflow-hidden">
        <CategoryTabs
          categories={categories}
          selected={selectedCategory}
          onSelect={setSelectedCategory}
        />
        <div className="flex-1 overflow-y-auto mt-3">
          <ProductGrid products={filteredProducts} onSelect={handleProductSelect} />
        </div>
      </div>

      {/* Right: Order panel (desktop) */}
      <div className="hidden lg:block w-80 border-l border-gray-200">
        <OrderPanel onCharge={handleCharge} />
      </div>

      {/* Mobile: floating cart button */}
      <div className="lg:hidden fixed bottom-20 right-4 z-30">
        {getItemCount() > 0 && (
          <button
            onClick={() => setShowCart(true)}
            className="bg-emerald-600 text-white rounded-full px-5 py-3 shadow-lg flex items-center gap-2 font-semibold"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
            </svg>
            {getItemCount()} - S/ {getTotal().toFixed(2)}
          </button>
        )}
      </div>

      {/* Mobile: cart slide-up */}
      {showCart && (
        <div className="lg:hidden fixed inset-0 z-40">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowCart(false)} />
          <div className="absolute bottom-0 left-0 right-0 h-[70vh] rounded-t-2xl overflow-hidden">
            <OrderPanel onCharge={handleCharge} />
          </div>
        </div>
      )}

      <PaymentModal
        isOpen={showPayment}
        onClose={() => setShowPayment(false)}
        total={getTotal()}
        onConfirm={handleConfirmPayment}
      />
    </div>
  );
}
