import { useState } from 'react';
import type { CustomerStatsDto } from '@pos/shared';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { customersApi } from '../../api/customers.api';
import { handleApiError } from '../../utils/api-error';

export function EditCustomerModal({
  customer,
  onClose,
  onUpdate,
  onDeleted,
}: {
  customer: CustomerStatsDto;
  onClose: () => void;
  onUpdate: () => void;
  onDeleted?: () => void;
}) {
  const [name, setName] = useState(customer.name);
  const [phone, setPhone] = useState(customer.phone ?? '');
  const [email, setEmail] = useState(customer.email ?? '');
  const [notes, setNotes] = useState(customer.notes ?? '');
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleSaveEdit() {
    if (!name.trim()) return;
    setSaving(true);
    try {
      await customersApi.update(customer.id, {
        name: name.trim(),
        phone: phone.trim() || null,
        email: email.trim() || null,
        notes: notes.trim() || null,
      });
      onUpdate();
    } catch (err) {
      handleApiError(err, 'Error al guardar');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      await customersApi.delete(customer.id);
      onDeleted?.();
      onClose();
    } catch (err) {
      handleApiError(err, 'Error al eliminar');
      setDeleting(false);
      setConfirmDelete(false);
    }
  }

  const inputCls = 'w-full text-sm border border-[var(--border-subtle)] rounded-xl px-3 py-2.5 bg-[var(--color-surface-card)] text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-[3px] focus:ring-primary-500/20 focus:border-primary-500/50 transition-[border-color,box-shadow]';

  return (
    <Modal isOpen onClose={onClose} title="Editar Cliente" size="sm">
      {/* Purchase stats summary */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="bg-[var(--color-surface-2)] rounded-2xl p-4 text-center border border-[var(--border-subtle)] shadow-sm">
          <p className="text-3xl font-black text-gray-900 font-heading leading-none">{customer.purchaseCount}</p>
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mt-2">Compras</p>
        </div>
        <div className="bg-[var(--color-surface-2)] rounded-2xl p-4 text-center border border-[var(--border-subtle)] shadow-sm">
          <p className="text-2xl font-black text-primary-600 font-heading leading-tight flex items-center justify-center gap-1">
            <span className="text-sm text-primary-400 font-bold">Bs</span>
            {customer.totalSpent.toFixed(0)}
          </p>
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mt-1">Gastado</p>
        </div>
      </div>

      <div className="space-y-4 mb-6">
        <div>
          <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">Nombre *</label>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej. Juan Pérez" className={inputCls} />
        </div>
        <div>
          <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">Teléfono</label>
          <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Ej. 77712345" className={inputCls} />
        </div>
        <div>
          <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">Email</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Ej. juan@email.com" className={inputCls} />
        </div>
        <div>
          <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">Notas</label>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Preferencias, alergias, etc." rows={2}
            className={`${inputCls} resize-none`} />
        </div>
      </div>

      <div className="flex gap-3">
        <Button variant="secondary" onClick={onClose} disabled={saving || deleting}>Cancelar</Button>
        <Button variant="primary" fullWidth onClick={handleSaveEdit} loading={saving} disabled={!name.trim() || saving || deleting}>
          Guardar cambios
        </Button>
      </div>

      {/* Delete zone */}
      <div className="mt-5 pt-4 border-t border-[var(--border-subtle)]">
        {!confirmDelete ? (
          <button
            onClick={() => setConfirmDelete(true)}
            disabled={saving || deleting}
            className="w-full text-[13px] font-medium text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl py-2 transition-colors disabled:opacity-40"
          >
            Eliminar cliente
          </button>
        ) : (
          <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl p-3">
            <p className="text-[13px] font-semibold text-red-700 dark:text-red-400 mb-2 text-center">
              ¿Eliminar a <span className="font-black">{customer.name}</span>?
            </p>
            <p className="text-[11px] text-red-500/80 text-center mb-3">Esta acción no se puede deshacer.</p>
            <div className="flex gap-2">
              <button
                onClick={() => setConfirmDelete(false)}
                disabled={deleting}
                className="flex-1 text-[13px] font-semibold text-gray-600 bg-white dark:bg-white/10 border border-[var(--border-subtle)] rounded-xl py-2 hover:bg-gray-50 transition-colors disabled:opacity-40"
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 text-[13px] font-bold text-white bg-red-500 hover:bg-red-600 rounded-xl py-2 transition-colors disabled:opacity-60 flex items-center justify-center gap-1.5"
              >
                {deleting ? 'Eliminando…' : 'Sí, eliminar'}
              </button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}

