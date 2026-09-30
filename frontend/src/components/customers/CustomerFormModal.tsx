import { useId, useState } from 'react';
import toast from 'react-hot-toast';
import type { CustomerDto } from '@pos/shared';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input, Textarea } from '../ui/Input';
import { customersApi } from '../../api/customers.api';
import { handleApiError } from '../../utils/api-error';

/** Crear un cliente (`customer` null) o editar sus datos de contacto y notas. */
export function CustomerFormModal({ customer, onClose, onSaved }: {
  customer: CustomerDto | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const formId = useId();
  const editing = customer !== null;
  const [name, setName]   = useState(customer?.name ?? '');
  const [phone, setPhone] = useState(customer?.phone ?? '');
  const [email, setEmail] = useState(customer?.email ?? '');
  const [notes, setNotes] = useState(customer?.notes ?? '');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    try {
      if (editing) {
        await customersApi.update(customer.id, {
          name:  name.trim(),
          phone: phone.trim() || null,
          email: email.trim() || null,
          notes: notes.trim() || null,
        });
        toast.success('Cliente actualizado');
      } else {
        await customersApi.create({
          name:  name.trim(),
          phone: phone.trim() || undefined,
          email: email.trim() || undefined,
          notes: notes.trim() || undefined,
        });
        toast.success(`${name.trim()} agregado a tus clientes`);
      }
      onSaved();
      onClose();
    } catch (err) {
      handleApiError(err, editing ? 'Error al guardar el cliente' : 'Error al crear el cliente');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={editing ? `Editar a ${customer.name}` : 'Nuevo cliente'}
      size="sm"
      footer={
        <div className="flex gap-3">
          <Button type="button" variant="secondary" fullWidth onClick={onClose} disabled={saving}>Cancelar</Button>
          <Button type="submit" form={formId} fullWidth loading={saving} disabled={!name.trim()}>
            {editing ? 'Guardar cambios' : 'Crear cliente'}
          </Button>
        </div>
      }
    >
      <form id={formId} onSubmit={handleSubmit} className="space-y-4">
        <Input label="Nombre" autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej.: Juan Pérez" required />
        <Input label="Teléfono (opcional)" type="tel" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Ej.: 77712345" />
        <Input label="Correo (opcional)" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Ej.: juan@correo.com" />
        <Textarea label="Notas (opcional)" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Preferencias, alergias" />
      </form>
    </Modal>
  );
}
