import { useState, useEffect } from 'react';
import type { CategoryDto } from '@pos/shared';
import { categoriesApi } from '../../api/categories.api';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Icon } from '../ui/Icon';
import { handleApiError } from '../../utils/api-error';
import toast from 'react-hot-toast';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  categories: CategoryDto[];
  onSaved: () => void;
}

export function CategoryManagerModal({ isOpen, onClose, categories, onSaved }: Props) {
  const [editingId, setEditingId]     = useState<string | null>(null);
  const [editName, setEditName]       = useState('');
  const [editOrder, setEditOrder]     = useState('0');
  const [deletingId, setDeletingId]   = useState<string | null>(null);
  const [saving, setSaving]           = useState(false);
  const [deleting, setDeleting]       = useState(false);

  const [newName, setNewName]         = useState('');
  const [newOrder, setNewOrder]       = useState('');
  const [showNewForm, setShowNewForm] = useState(false);
  const [creating, setCreating]       = useState(false);

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
    setShowNewForm(false);
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
          <div className="text-center py-10">
            <div className="w-12 h-12 rounded-2xl bg-[var(--color-surface-2)] flex items-center justify-center mx-auto mb-3">
              <Icon name="box" size={22} strokeWidth={1.5} className="text-gray-300" />
            </div>
            <p className="text-sm text-gray-400">Sin categorías aún</p>
            <p className="text-xs text-gray-300 mt-1">Crea la primera con el botón de abajo</p>
          </div>
        ) : (
          <div className="rounded-xl border border-[var(--border-subtle)] divide-y divide-[var(--border-subtle)] overflow-hidden">
            {categories.map((cat) => (
              <div key={cat.id}>

                {/* View row */}
                {editingId !== cat.id && (
                  <div className={`transition-colors ${deletingId === cat.id ? 'bg-red-500/5' : 'hover:bg-[var(--color-surface-2)]'}`}>
                    <div className="flex items-center gap-3 px-4 py-3.5">
                      <div className="flex-1 min-w-0">
                        <p className="text-base font-semibold text-gray-900 truncate">{cat.name}</p>
                        <p className="text-xs text-gray-400 mt-0.5">Posición {cat.sortOrder}</p>
                      </div>

                      {deletingId === cat.id ? (
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-xs text-red-600 font-semibold">¿Eliminar?</span>
                          <button
                            onClick={() => confirmDelete(cat.id)}
                            disabled={deleting}
                            className="text-xs font-bold text-white bg-red-500 hover:bg-red-600 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                          >
                            {deleting ? '…' : 'Sí, eliminar'}
                          </button>
                          <button
                            onClick={() => setDeletingId(null)}
                            className="text-xs text-gray-500 hover:text-gray-700 px-2.5 py-1.5 rounded-lg border border-[var(--border-subtle)] transition-colors"
                          >
                            Cancelar
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => startEdit(cat)}
                            className="p-2 rounded-lg text-gray-400 hover:text-primary-600 hover:bg-primary-500/10 transition-colors"
                            title="Editar"
                          >
                            <Icon name="edit" size={15} />
                          </button>
                          <button
                            onClick={() => { setDeletingId(cat.id); setEditingId(null); }}
                            className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-500/10 transition-colors"
                            title="Eliminar"
                          >
                            <Icon name="trash" size={15} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Inline edit form — apilado y con labels */}
                {editingId === cat.id && (
                  <div className="px-4 py-4 bg-[var(--color-surface-2)] border-l-2 border-primary-500/50">
                    <p className="text-xs font-bold text-primary-600 uppercase tracking-wide mb-3">
                      Editando categoría
                    </p>
                    <div className="space-y-3">
                      <Input
                        label="Nombre de la categoría"
                        autoFocus
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        placeholder="Ej: Bebidas, Entradas, Postres…"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') saveEdit(cat.id);
                          if (e.key === 'Escape') cancelEdit();
                        }}
                      />
                      <Input
                        label="Orden en menú"
                        type="number"
                        value={editOrder}
                        onChange={(e) => setEditOrder(e.target.value)}
                        placeholder="0"
                      />
                      <p className="text-xs text-gray-400 -mt-1">
                        Número menor aparece primero en el POS. Usa 0 si no importa el orden.
                      </p>
                      <div className="flex gap-2 pt-1">
                        <Button
                          onClick={() => saveEdit(cat.id)}
                          disabled={saving || !editName.trim()}
                          loading={saving}
                          fullWidth
                        >
                          Guardar cambios
                        </Button>
                        <Button variant="secondary" onClick={cancelEdit} fullWidth>
                          Cancelar
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

              </div>
            ))}
          </div>
        )}

        {/* New category form */}
        {showNewForm ? (
          <form
            onSubmit={createCategory}
            className="rounded-xl border border-primary-500/30 bg-primary-500/5 px-4 py-4 space-y-3"
          >
            <p className="text-xs font-bold text-primary-600 uppercase tracking-wide">
              Nueva categoría
            </p>
            <Input
              label="Nombre de la categoría"
              autoFocus
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Ej: Bebidas, Entradas, Postres…"
              required
            />
            <Input
              label="Orden en menú"
              type="number"
              value={newOrder}
              onChange={(e) => setNewOrder(e.target.value)}
              placeholder="0 — aparece al final"
            />
            <p className="text-xs text-gray-400 -mt-1">
              Número menor aparece primero. Déjalo en 0 si no importa el orden.
            </p>
            <div className="flex gap-2 pt-1">
              <Button type="submit" loading={creating} disabled={!newName.trim()} fullWidth>
                Crear categoría
              </Button>
              <Button
                type="button"
                variant="secondary"
                fullWidth
                onClick={() => { setShowNewForm(false); setNewName(''); setNewOrder(''); }}
              >
                Cancelar
              </Button>
            </div>
          </form>
        ) : (
          <button
            onClick={() => { setShowNewForm(true); setEditingId(null); }}
            className="flex items-center gap-2 w-full px-4 py-3 rounded-xl border border-dashed border-[var(--border-subtle)] text-sm font-medium text-gray-400 hover:text-primary-600 hover:border-primary-500/40 hover:bg-primary-500/5 transition-colors"
          >
            <Icon name="plus" size={16} strokeWidth={2.5} />
            Agregar categoría
          </button>
        )}

      </div>

      <div className="mt-4 pt-3 border-t border-[var(--border-subtle)] flex justify-end">
        <Button variant="secondary" onClick={onClose}>Cerrar</Button>
      </div>
    </Modal>
  );
}
