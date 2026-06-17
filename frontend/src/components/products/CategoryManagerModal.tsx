import { useState, useEffect } from 'react';
import type { CategoryDto } from '@pos/shared';
import { categoriesApi } from '../../api/categories.api';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Icon } from '../ui/Icon';
import { handleApiError } from '../../utils/api-error';
import toast from 'react-hot-toast';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  categories: CategoryDto[];
  onSaved: () => void;
}

const inputCls =
  'w-full text-sm border border-[var(--border-subtle)] rounded-xl px-3 py-2 bg-[var(--color-surface-card)] text-gray-700 ' +
  'focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500/50 transition-[border-color,box-shadow]';

export function CategoryManagerModal({ isOpen, onClose, categories, onSaved }: Props) {
  const [editingId, setEditingId]       = useState<string | null>(null);
  const [editName, setEditName]         = useState('');
  const [editOrder, setEditOrder]       = useState('0');
  const [deletingId, setDeletingId]     = useState<string | null>(null);
  const [saving, setSaving]             = useState(false);
  const [deleting, setDeleting]         = useState(false);

  // New category form
  const [newName, setNewName]           = useState('');
  const [newOrder, setNewOrder]         = useState('');
  const [showNewForm, setShowNewForm]   = useState(false);
  const [creating, setCreating]         = useState(false);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setEditingId(null);
      setDeletingId(null);
      setShowNewForm(false);
      setNewName('');
      setNewOrder('');
    }
  }, [isOpen]);

  const startEdit = (cat: CategoryDto) => {
    setEditingId(cat.id);
    setEditName(cat.name);
    setEditOrder(String(cat.sortOrder));
    setDeletingId(null);
  };

  const cancelEdit = () => setEditingId(null);

  const saveEdit = async (id: string) => {
    if (!editName.trim()) return;
    setSaving(true);
    try {
      await categoriesApi.update(id, { name: editName.trim(), sortOrder: parseInt(editOrder) || 0 });
      toast.success('Categoría actualizada');
      onSaved();
      setEditingId(null);
    } catch (err) {
      handleApiError(err);
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async (id: string) => {
    setDeleting(true);
    try {
      await categoriesApi.delete(id);
      toast.success('Categoría eliminada');
      onSaved();
      setDeletingId(null);
    } catch (err) {
      handleApiError(err, 'Error al eliminar categoría');
    } finally {
      setDeleting(false);
    }
  };

  const createCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setCreating(true);
    try {
      await categoriesApi.create({ name: newName.trim(), sortOrder: parseInt(newOrder) || 0 });
      toast.success('Categoría creada');
      onSaved();
      setNewName('');
      setNewOrder('');
      setShowNewForm(false);
    } catch (err) {
      handleApiError(err);
    } finally {
      setCreating(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Gestionar Categorías" size="md">
      <div className="space-y-2">

        {/* Category list */}
        {categories.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-6">Sin categorías aún.</p>
        ) : (
          <div className="rounded-xl border border-[var(--border-subtle)] divide-y divide-[var(--border-subtle)] overflow-hidden">
            {categories.map((cat) => (
              <div key={cat.id}>
                {/* View row */}
                {editingId !== cat.id && (
                  <div className={`flex items-center gap-3 px-4 py-3 transition-colors ${deletingId === cat.id ? 'bg-red-500/5' : 'hover:bg-[var(--color-surface-2)]'}`}>
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-medium text-gray-800">{cat.name}</span>
                      <span className="text-[11px] text-gray-400 ml-2">orden {cat.sortOrder}</span>
                    </div>

                    {deletingId === cat.id ? (
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs text-red-600 font-medium">¿Eliminar?</span>
                        <button
                          onClick={() => confirmDelete(cat.id)}
                          disabled={deleting}
                          className="text-xs font-bold text-white bg-red-500 hover:bg-red-600 px-2.5 py-1 rounded-lg transition-colors disabled:opacity-50"
                        >
                          Sí
                        </button>
                        <button
                          onClick={() => setDeletingId(null)}
                          className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1 rounded-lg transition-colors"
                        >
                          No
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => startEdit(cat)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-primary-600 hover:bg-primary-500/8 transition-colors"
                          title="Editar"
                        >
                          <Icon name="edit" size={14} />
                        </button>
                        <button
                          onClick={() => { setDeletingId(cat.id); setEditingId(null); }}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-500/8 transition-colors"
                          title="Eliminar"
                        >
                          <Icon name="trash" size={14} />
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Inline edit form */}
                {editingId === cat.id && (
                  <div className="px-4 py-3 bg-[var(--color-surface-2)]">
                    <div className="flex items-center gap-2">
                      <input
                        autoFocus
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        placeholder="Nombre"
                        className={`${inputCls} flex-1`}
                        onKeyDown={(e) => { if (e.key === 'Enter') saveEdit(cat.id); if (e.key === 'Escape') cancelEdit(); }}
                      />
                      <input
                        type="number"
                        value={editOrder}
                        onChange={(e) => setEditOrder(e.target.value)}
                        placeholder="Orden"
                        className={`${inputCls} w-20`}
                      />
                      <button
                        onClick={() => saveEdit(cat.id)}
                        disabled={saving || !editName.trim()}
                        className="p-2 rounded-lg bg-primary-600 hover:bg-primary-500 text-white transition-colors disabled:opacity-50"
                        title="Guardar"
                      >
                        <Icon name="check" size={14} strokeWidth={2.5} />
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-[var(--color-surface-3)] transition-colors"
                        title="Cancelar"
                      >
                        <Icon name="x" size={14} strokeWidth={2} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* New category */}
        {showNewForm ? (
          <form onSubmit={createCategory} className="rounded-xl border border-[var(--border-subtle)] p-3 bg-[var(--color-surface-2)]">
            <p className="text-xs font-semibold text-gray-500 mb-2">Nueva categoría</p>
            <div className="flex items-center gap-2">
              <input
                autoFocus
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Nombre *"
                className={`${inputCls} flex-1`}
                required
              />
              <input
                type="number"
                value={newOrder}
                onChange={(e) => setNewOrder(e.target.value)}
                placeholder="Orden"
                className={`${inputCls} w-20`}
              />
              <Button type="submit" size="sm" loading={creating} disabled={!newName.trim()}>
                Crear
              </Button>
              <button
                type="button"
                onClick={() => { setShowNewForm(false); setNewName(''); setNewOrder(''); }}
                className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-[var(--color-surface-3)] transition-colors"
              >
                <Icon name="x" size={14} strokeWidth={2} />
              </button>
            </div>
          </form>
        ) : (
          <button
            onClick={() => setShowNewForm(true)}
            className="flex items-center gap-2 w-full px-4 py-2.5 rounded-xl border border-dashed border-[var(--border-subtle)] text-sm font-medium text-gray-400 hover:text-primary-600 hover:border-primary-500/40 hover:bg-primary-500/5 transition-colors"
          >
            <Icon name="plus" size={16} strokeWidth={2} />
            Nueva categoría
          </button>
        )}
      </div>

      <div className="mt-4 pt-3 border-t border-[var(--border-subtle)] flex justify-end">
        <Button variant="secondary" onClick={onClose}>Cerrar</Button>
      </div>
    </Modal>
  );
}
