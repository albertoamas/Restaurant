import { useState } from 'react';
import toast from 'react-hot-toast';
import type { ProductDto, CategoryDto } from '@pos/shared';
import { productsApi } from '../api/products.api';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Spinner } from '../components/ui/Spinner';
import { Toggle } from '../components/ui/Toggle';
import { useProducts } from '../hooks/useProducts';
import { useCategories } from '../hooks/useCategories';
import { handleApiError } from '../utils/api-error';
import { ProductFormModal } from '../components/products/ProductFormModal';
import { CategoryFormModal } from '../components/products/CategoryFormModal';

export function ProductsPage() {
  const { products, loading: prodsLoading, reload: reloadProducts } = useProducts(true);
  const { categories, loading: catsLoading, reload: reloadCategories } = useCategories();
  const loading = prodsLoading || catsLoading;

  const [showProductModal, setShowProductModal] = useState(false);
  const [showCatModal, setShowCatModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductDto | null>(null);
  const [editingCategory, setEditingCategory] = useState<CategoryDto | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const fetchData = () => {
    reloadProducts();
    reloadCategories();
  };

  const openNewProduct = () => {
    setEditingProduct(null);
    setShowProductModal(true);
  };

  const openEditProduct = (p: ProductDto) => {
    setEditingProduct(p);
    setShowProductModal(true);
  };

  const handleToggle = async (id: string) => {
    try {
      await productsApi.toggle(id);
      toast.success('Estado actualizado');
      fetchData();
    } catch (err) {
      handleApiError(err, 'Error al cambiar estado');
    }
  };

  const getCategoryName = (catId: string) =>
    categories.find((c) => c.id === catId)?.name || '-';

  const filteredProducts = selectedCategory
    ? products.filter((p) => p.categoryId === selectedCategory)
    : products;

  if (loading) {
    return <div className="flex justify-center py-12"><Spinner /></div>;
  }

  const activeClass = 'bg-primary-600 text-white border border-primary-600 shadow-[0_2px_8px_oklch(0.45_0.16_235/0.20)]';
  const inactiveClass = 'bg-white text-gray-600 border border-gray-200 hover:border-primary-400 hover:text-primary-800';

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto animate-slide">
      {/* Toolbar */}
      <div className="rounded-2xl border border-white/70 bg-white/80 backdrop-blur-xl shadow-[0_10px_30px_oklch(0.13_0.012_260/0.10)] p-4 sm:p-5 mb-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <div>
            <h2 className="font-heading text-xl sm:text-2xl font-black text-gray-900">Catálogo de Productos</h2>
            <p className="text-xs text-gray-500 mt-0.5">Administra precios, estado y categorías con control total.</p>
          </div>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-primary-50 text-primary-700 border border-primary-200 w-fit">
            {filteredProducts.length} productos
          </span>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        {/* Category filter chips */}
        <div className="flex flex-wrap gap-1.5 flex-1 min-w-0">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-150 ${
              selectedCategory === null ? activeClass : inactiveClass
            }`}
          >
            Todos
          </button>
          {categories.map((cat) => (
            <div key={cat.id} className="flex items-center gap-0.5">
              <button
                onClick={() => setSelectedCategory(cat.id === selectedCategory ? null : cat.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-150 ${
                  selectedCategory === cat.id ? activeClass : inactiveClass
                }`}
              >
                {cat.name}
              </button>
              <button
                onClick={() => { setEditingCategory(cat); setShowCatModal(true); }}
                className="p-1.5 rounded-lg text-gray-400 hover:text-primary-600 hover:bg-primary-50 transition-colors"
                title="Editar categoría"
                aria-label={`Editar categoría ${cat.name}`}
              >
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
            </div>
          ))}
        </div>
        <div className="flex gap-2 shrink-0">
          <Button size="sm" onClick={openNewProduct}>+ Producto</Button>
          <Button size="sm" variant="secondary" onClick={() => { setEditingCategory(null); setShowCatModal(true); }}>+ Agregar categoría</Button>
        </div>
        </div>
      </div>

      {filteredProducts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-gray-400 rounded-2xl border border-white/70 bg-white/75 backdrop-blur-sm shadow-[0_6px_20px_oklch(0.13_0.012_260/0.06)]">
          <svg className="w-10 h-10 mb-3 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
          </svg>
          <p className="text-sm font-semibold text-gray-500">Sin productos</p>
          <p className="text-xs mt-1">
            {selectedCategory ? 'No hay productos en esta categoría' : 'Crea tu primer producto'}
          </p>
        </div>
      ) : (
        <>
          {/* Mobile card list — hidden on lg+ */}
          <div className="lg:hidden space-y-2">
            {filteredProducts.map((p) => (
              <div
                key={p.id}
                className={`flex items-center gap-3 bg-white/90 rounded-2xl border border-white/70
                  shadow-[0_6px_18px_oklch(0.13_0.012_260/0.09)] p-3 transition-colors
                  ${!p.isActive ? 'opacity-60' : ''}`}
              >
                {/* Thumbnail */}
                <div className="shrink-0 w-14 h-14 rounded-xl overflow-hidden bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center">
                  {p.imageUrl ? (
                    <img
                      src={p.imageUrl}
                      alt={p.name}
                      className="w-full h-full object-cover"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                  ) : (
                    <svg className="w-6 h-6 text-primary-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">{p.name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-gray-400 bg-gray-100 rounded-md px-1.5 py-0.5 truncate max-w-[120px]">
                      {getCategoryName(p.categoryId)}
                    </span>
                    <span className="font-heading font-bold text-sm text-gray-900">Bs {p.price.toFixed(2)}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => openEditProduct(p)}
                    className="text-xs text-primary-600 hover:text-primary-700 font-semibold transition-colors"
                  >
                    Editar
                  </button>
                  <Toggle
                    checked={p.isActive}
                    onChange={() => handleToggle(p.id)}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Desktop table — hidden below lg */}
          <div className="hidden lg:block bg-white/90 backdrop-blur-sm rounded-2xl border border-white/70 shadow-[0_8px_24px_oklch(0.13_0.012_260/0.10)] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-[oklch(0.99_0.004_250)]">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide w-16"></th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Producto</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Categoría</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Precio</th>
                    <th className="text-center px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Estado</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredProducts.map((p) => (
                    <tr key={p.id} className={`transition-colors hover:bg-gray-50/60 ${!p.isActive ? 'opacity-60' : ''}`}>
                      <td className="px-4 py-3">
                        <div className="w-12 h-12 rounded-xl overflow-hidden bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center shrink-0">
                          {p.imageUrl ? (
                            <img
                              src={p.imageUrl}
                              alt={p.name}
                              className="w-full h-full object-cover"
                              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                            />
                          ) : (
                            <svg className="w-5 h-5 text-primary-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 font-semibold text-gray-900">{p.name}</td>
                      <td className="px-4 py-3">
                        <span className="text-xs text-gray-500 bg-gray-100 rounded-lg px-2 py-1">
                          {getCategoryName(p.categoryId)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-heading font-bold text-gray-900">Bs {p.price.toFixed(2)}</td>
                      <td className="px-4 py-3 text-center">
                        <Badge variant={p.isActive ? 'success' : 'neutral'} dot>
                          {p.isActive ? 'Activo' : 'Inactivo'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end items-center gap-3">
                          <button
                            onClick={() => openEditProduct(p)}
                            className="text-xs text-primary-600 hover:text-primary-700 font-semibold transition-colors"
                          >
                            Editar
                          </button>
                          <Toggle checked={p.isActive} onChange={() => handleToggle(p.id)} />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      <ProductFormModal
        isOpen={showProductModal}
        onClose={() => { setShowProductModal(false); setEditingProduct(null); }}
        onSaved={fetchData}
        product={editingProduct}
        categories={categories}
      />

      <CategoryFormModal
        isOpen={showCatModal}
        onClose={() => { setShowCatModal(false); setEditingCategory(null); }}
        onSaved={fetchData}
        category={editingCategory}
      />
    </div>
  );
}
