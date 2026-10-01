import { useState, useRef, useEffect, useId } from 'react';
import toast from 'react-hot-toast';
import type { ProductDto, CreateProductRequest, CategoryDto } from '@pos/shared';
import { productsApi } from '../../api/products.api';
import { uploadsApi } from '../../api/uploads.api';
import { Button } from '../ui/Button';
import { Input, Select } from '../ui/Input';
import { Modal } from '../ui/Modal';
import { Icon } from '../ui/Icon';
import { handleApiError } from '../../utils/api-error';

interface ProductFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  /** Pide eliminar el producto (la confirmación vive en la página). */
  onDelete?: (product: ProductDto) => void;
  product: ProductDto | null;
  categories: CategoryDto[];
}

const EMPTY_FORM = { name: '', price: '', categoryId: '', imageUrl: '' };

/** Crear o editar un producto: nombre, precio, categoría y foto. */
export function ProductFormModal({ isOpen, onClose, onSaved, onDelete, product, categories }: ProductFormModalProps) {
  const formId = useId();
  const [form, setForm] = useState(EMPTY_FORM);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState('');
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    if (product) {
      // La categoría pudo haberse eliminado: entonces se pide elegir otra.
      const stillExists = categories.some((c) => c.id === product.categoryId);
      setForm({ name: product.name, price: String(product.price), categoryId: stillExists ? product.categoryId : '', imageUrl: product.imageUrl ?? '' });
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

  const valid = form.name.trim() !== '' && form.price !== '' && Number(form.price) >= 0 && form.categoryId !== '';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid) return;
    setSaving(true);
    try {
      let finalImageUrl: string | null | undefined = form.imageUrl || null;
      if (imageFile) finalImageUrl = await uploadsApi.image(imageFile);
      const data = { name: form.name.trim(), price: parseFloat(form.price), categoryId: form.categoryId, imageUrl: finalImageUrl };
      if (product) await productsApi.update(product.id, data);
      else         await productsApi.create(data as CreateProductRequest);
      toast.success(product ? 'Producto actualizado' : `${data.name} agregado al catálogo`);
      onSaved();
      onClose();
    } catch (err) {
      handleApiError(err, product ? 'Error al guardar el producto' : 'Error al crear el producto');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={product ? `Editar ${product.name}` : 'Nuevo producto'}
      footer={
        <div className="flex gap-3">
          {product && onDelete && (
            <Button type="button" variant="ghost" onClick={() => onDelete(product)} disabled={saving} aria-label={`Eliminar ${product.name}`} title="Eliminar producto">
              <Icon name="trash" size={18} />
            </Button>
          )}
          <Button type="button" variant="secondary" fullWidth onClick={onClose} disabled={saving}>Cancelar</Button>
          <Button type="submit" form={formId} fullWidth loading={saving} disabled={!valid}>
            {product ? 'Guardar cambios' : 'Crear producto'}
          </Button>
        </div>
      }
    >
      <form id={formId} onSubmit={handleSubmit} className="space-y-4">
        <Input label="Nombre" autoFocus={!product} placeholder="Ej.: hamburguesa clásica" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label="Precio"
            type="number"
            inputMode="decimal"
            step="0.01"
            min="0"
            placeholder="0.00"
            leftAddon="Bs"
            value={form.price}
            onChange={(e) => setForm({ ...form, price: e.target.value })}
            required
          />
          <Select
            label="Categoría"
            value={form.categoryId}
            onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
            error={product && form.categoryId === '' ? 'Su categoría se eliminó: elige otra' : undefined}
            required
          >
            <option value="">Elige una categoría</option>
            {categories.map((cat) => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
          </Select>
        </div>

        <div>
          <p className="mb-1.5 text-label font-medium text-soft">Foto (opcional)</p>
          {imagePreview ? (
            <div className="flex items-center gap-3">
              <img src={imagePreview} alt="Vista previa de la foto" className="h-24 w-24 rounded-control border border-line object-cover" />
              <div className="flex flex-col gap-2">
                <Button type="button" variant="secondary" size="sm" onClick={() => fileInputRef.current?.click()}>
                  <Icon name="photo" size={16} />
                  Cambiar foto
                </Button>
                <Button type="button" variant="ghost" size="sm" onClick={handleRemoveImage}>
                  <Icon name="x" size={16} />
                  Quitar foto
                </Button>
              </div>
            </div>
          ) : (
            <label
              htmlFor="product-image-input"
              className="flex min-h-24 w-full cursor-pointer flex-col items-center justify-center gap-1 rounded-control border-2 border-dashed border-line-strong px-4 py-4 text-center text-soft transition-colors hover:border-primary-500/60 hover:text-main"
            >
              <Icon name="photo" size={24} />
              <span className="text-body font-semibold">Subir una foto</span>
              <span className="text-caption text-muted">JPG, PNG, WEBP o GIF, hasta 10 MB. Sin foto se muestra la inicial.</span>
            </label>
          )}
          <input
            id="product-image-input"
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>
      </form>
    </Modal>
  );
}
