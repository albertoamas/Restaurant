import { useState, useEffect } from 'react';
import type { CategoryDto } from '@pos/shared';
import { categoriesApi } from '../../api/categories.api';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Modal } from '../ui/Modal';
import { handleApiError } from '../../utils/api-error';
import toast from 'react-hot-toast';

interface CategoryFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  category?: CategoryDto | null;
}

export function CategoryFormModal({ isOpen, onClose, onSaved, category }: CategoryFormModalProps) {
  const [form, setForm] = useState({ name: '', sortOrder: '0' });
  const [loading, setLoading] = useState(false);
  const isEdit = !!category;

  useEffect(() => {
    if (isOpen) {
      setForm({
        name: category?.name ?? '',
        sortOrder: String(category?.sortOrder ?? 0),
      });
    }
  }, [isOpen, category]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isEdit) {
        await categoriesApi.update(category.id, { name: form.name, sortOrder: parseInt(form.sortOrder) });
        toast.success('Categoría actualizada');
      } else {
        await categoriesApi.create({ name: form.name, sortOrder: parseInt(form.sortOrder) });
        toast.success('Categoría creada');
      }
      onSaved();
      onClose();
    } catch (err) {
      handleApiError(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEdit ? 'Editar Categoría' : 'Nueva Categoría'} size="sm">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Nombre"
          placeholder="Ej: Hamburguesas"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          required
        />
        <Input
          label="Orden"
          type="number"
          value={form.sortOrder}
          onChange={(e) => setForm({ ...form, sortOrder: e.target.value })}
          hint="Un número menor aparece primero en el menú"
        />
        <div className="flex gap-3 pt-1">
          <Button type="button" variant="secondary" fullWidth onClick={onClose}>Cancelar</Button>
          <Button type="submit" fullWidth loading={loading}>
            {isEdit ? 'Guardar Cambios' : 'Crear Categoría'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
