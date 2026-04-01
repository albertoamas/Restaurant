import { useState, useRef, useEffect } from 'react';
import type { ProductDto, CreateProductRequest, CategoryDto } from '@pos/shared';
import { productsApi } from '../../api/products.api';
import { uploadsApi } from '../../api/uploads.api';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Modal } from '../ui/Modal';
import { handleApiError } from '../../utils/api-error';

interface ProductFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  product: ProductDto | null;
  categories: CategoryDto[];
}

const EMPTY_FORM = { name: '', price: '', categoryId: '', imageUrl: '' };

export function ProductFormModal({ isOpen, onClose, onSaved, product, categories }: ProductFormModalProps) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (product) {
      setForm({
        name: product.name,
        price: String(product.price),
        categoryId: product.categoryId,
        imageUrl: product.imageUrl ?? '',
      });
      setImagePreview(product.imageUrl ?? '');
    } else {
      setForm({ ...EMPTY_FORM, categoryId: categories[0]?.id || '' });
      setImagePreview('');
    }
    setImageFile(null);
  }, [product, isOpen, categories]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview('');
    setForm((f) => ({ ...f, imageUrl: '' }));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);
    try {
      let finalImageUrl = form.imageUrl || undefined;
      if (imageFile) {
        finalImageUrl = await uploadsApi.image(imageFile);
      }

      const data = {
        name: form.name,
        price: parseFloat(form.price),
        categoryId: form.categoryId,
        imageUrl: finalImageUrl,
      };

      if (product) {
        await productsApi.update(product.id, data);
      } else {
        await productsApi.create(data as CreateProductRequest);
      }
      onSaved();
      onClose();
    } catch (err) {
      handleApiError(err);
    } finally {
      setUploading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={product ? 'Editar Producto' : 'Nuevo Producto'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Nombre"
          placeholder="Ej: Hamburguesa Clásica"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          required
        />
        <Input
          label="Precio"
          type="number"
          step="0.01"
          min="0"
          placeholder="0.00"
          value={form.price}
          onChange={(e) => setForm({ ...form, price: e.target.value })}
          required
          leftAddon={<span className="text-gray-400 text-sm font-medium">Bs</span>}
        />
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Categoría</label>
          <select
            value={form.categoryId}
            onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
            required
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white
              focus:outline-none focus:ring-[3px] focus:ring-primary-500/20 focus:border-primary-500
              transition-[border-color,box-shadow]"
          >
            <option value="">Selecciona...</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
        </div>

        {/* Image upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Imagen <span className="text-gray-400 font-normal text-xs">(opcional)</span>
          </label>

          {imagePreview ? (
            <div className="relative w-full h-36 rounded-xl overflow-hidden border border-gray-200">
              <img src={imagePreview} alt="Vista previa" className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={handleRemoveImage}
                className="absolute top-2 right-2 bg-white rounded-full p-1.5 shadow-md hover:bg-red-50 transition-colors border border-gray-100"
                title="Quitar imagen"
              >
                <svg className="w-3.5 h-3.5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex flex-col items-center justify-center gap-2 w-full h-28 border-2 border-dashed border-gray-200
                rounded-xl hover:border-primary-400 hover:bg-primary-50/30 transition-colors text-gray-400 hover:text-primary-500"
            >
              <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="text-sm font-semibold">Haz clic para subir imagen</span>
              <span className="text-xs text-gray-400">JPG, PNG, WEBP · máx. 2 MB</span>
            </button>
          )}

          <input
            ref={fileInputRef}
            type="file" accept="image/*" className="hidden"
            onChange={handleFileChange}
          />
        </div>

        <div className="flex gap-3 pt-1">
          <Button type="button" variant="secondary" fullWidth onClick={onClose}>Cancelar</Button>
          <Button type="submit" fullWidth loading={uploading}>
            {product ? 'Guardar Cambios' : 'Crear Producto'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
