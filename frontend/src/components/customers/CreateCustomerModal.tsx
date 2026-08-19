import { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { customersApi } from '../../api/customers.api';
import { handleApiError } from '../../utils/api-error';

export function CreateCustomerModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleSubmit() {
    if (!name.trim()) return;
    setSaving(true);
    try {
      await customersApi.create({
        name: name.trim(),
        phone: phone.trim() || undefined,
        email: email.trim() || undefined,
        notes: notes.trim() || undefined,
      });
      onCreated();
      onClose();
    } catch (err) {
      handleApiError(err, 'Error al crear cliente');
    } finally {
      setSaving(false);
    }
  }

  const inputCls = 'w-full text-sm border border-[var(--border-subtle)] rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500/50 bg-[var(--color-surface-card)] text-gray-700 placeholder:text-gray-400 transition-colors';

  return (
    <Modal isOpen onClose={onClose} title="Nuevo Cliente" size="sm">
      <div className="space-y-3">
        <input autoFocus type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Nombre *" className={inputCls} />
        <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Teléfono" className={inputCls} />
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" className={inputCls} />
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notas (opcional)" rows={2}
          className="w-full text-sm border border-[var(--border-subtle)] rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary-500/20 resize-none bg-[var(--color-surface-card)] text-gray-700 placeholder:text-gray-400" />
        <div className="flex gap-2 pt-1">
          <Button variant="secondary" onClick={onClose} disabled={saving}>Cancelar</Button>
          <Button variant="primary" fullWidth onClick={handleSubmit} loading={saving} disabled={!name.trim()}>
            Crear Cliente
          </Button>
        </div>
      </div>
    </Modal>
  );
}
