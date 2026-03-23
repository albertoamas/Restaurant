import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import type { ProductDto, CategoryDto, CreateProductRequest } from '@pos/shared';
import { productsApi } from '../api/products.api';
import { categoriesApi } from '../api/categories.api';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { Badge } from '../components/ui/Badge';

export function ProductsPage() {
  const [products, setProducts] = useState<ProductDto[]>([]);
  const [categories, setCategories] = useState<CategoryDto[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [showCatModal, setShowCatModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductDto | null>(null);
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState({ name: '', price: '', categoryId: '' });
  const [catForm, setCatForm] = useState({ name: '', sortOrder: '0' });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [prods, cats] = await Promise.all([productsApi.getAll(), categoriesApi.getAll()]);
      setProducts(prods);
      setCategories(cats);
    } catch {
      toast.error('Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const openNewProduct = () => {
    setEditingProduct(null);
    setForm({ name: '', price: '', categoryId: categories[0]?.id || '' });
    setShowModal(true);
  };

  const openEditProduct = (p: ProductDto) => {
    setEditingProduct(p);
    setForm({ name: p.name, price: String(p.price), categoryId: p.categoryId });
    setShowModal(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = { name: form.name, price: parseFloat(form.price), categoryId: form.categoryId };
      if (editingProduct) {
        await productsApi.update(editingProduct.id, data);
        toast.success('Producto actualizado');
      } else {
        await productsApi.create(data as CreateProductRequest);
        toast.success('Producto creado');
      }
      setShowModal(false);
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error');
    }
  };

  const handleToggle = async (id: string) => {
    try {
      await productsApi.toggle(id);
      fetchData();
    } catch {
      toast.error('Error al cambiar estado');
    }
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await categoriesApi.create({ name: catForm.name, sortOrder: parseInt(catForm.sortOrder) });
      toast.success('Categoría creada');
      setShowCatModal(false);
      setCatForm({ name: '', sortOrder: '0' });
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error');
    }
  };

  const getCategoryName = (catId: string) =>
    categories.find((c) => c.id === catId)?.name || '-';

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-8 h-8 border-4 border-sky-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-4 max-w-4xl mx-auto">
      {/* Actions */}
      <div className="flex gap-2 mb-4">
        <Button onClick={openNewProduct}>+ Producto</Button>
        <Button variant="secondary" onClick={() => setShowCatModal(true)}>+ Categoría</Button>
      </div>

      {/* Categories summary */}
      <div className="flex flex-wrap gap-2 mb-4">
        {categories.map((cat) => (
          <span key={cat.id} className="px-3 py-1 bg-gray-100 rounded-lg text-sm text-gray-600">
            {cat.name}
          </span>
        ))}
      </div>

      {/* Products table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Producto</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Categoría</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">Precio</th>
                <th className="text-center px-4 py-3 font-medium text-gray-600">Estado</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {products.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{p.name}</td>
                  <td className="px-4 py-3 text-gray-600">{getCategoryName(p.categoryId)}</td>
                  <td className="px-4 py-3 text-right text-gray-900">S/ {p.price.toFixed(2)}</td>
                  <td className="px-4 py-3 text-center">
                    <Badge variant={p.isActive ? 'success' : 'neutral'}>
                      {p.isActive ? 'Activo' : 'Inactivo'}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-1">
                      <Button size="sm" variant="ghost" onClick={() => openEditProduct(p)}>
                        Editar
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => handleToggle(p.id)}>
                        {p.isActive ? 'Desactivar' : 'Activar'}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {products.length === 0 && (
          <div className="text-center py-8 text-gray-400">
            No hay productos. Crea el primero.
          </div>
        )}
      </div>

      {/* Product Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingProduct ? 'Editar Producto' : 'Nuevo Producto'}
      >
        <form onSubmit={handleSaveProduct} className="space-y-4">
          <Input
            label="Nombre"
            placeholder="Ej: Hamburguesa Clásica"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
          <Input
            label="Precio (S/)"
            type="number"
            step="0.01"
            min="0"
            placeholder="0.00"
            value={form.price}
            onChange={(e) => setForm({ ...form, price: e.target.value })}
            required
          />
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Categoría</label>
            <select
              value={form.categoryId}
              onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
              className="border border-gray-300 rounded-lg px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-sky-500"
              required
            >
              <option value="">Selecciona...</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>
          <Button type="submit" fullWidth>
            {editingProduct ? 'Guardar Cambios' : 'Crear Producto'}
          </Button>
        </form>
      </Modal>

      {/* Category Modal */}
      <Modal
        isOpen={showCatModal}
        onClose={() => setShowCatModal(false)}
        title="Nueva Categoría"
      >
        <form onSubmit={handleSaveCategory} className="space-y-4">
          <Input
            label="Nombre"
            placeholder="Ej: Hamburguesas"
            value={catForm.name}
            onChange={(e) => setCatForm({ ...catForm, name: e.target.value })}
            required
          />
          <Input
            label="Orden"
            type="number"
            value={catForm.sortOrder}
            onChange={(e) => setCatForm({ ...catForm, sortOrder: e.target.value })}
          />
          <Button type="submit" fullWidth>Crear Categoría</Button>
        </form>
      </Modal>
    </div>
  );
}
