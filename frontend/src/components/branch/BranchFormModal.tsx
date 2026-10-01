import { useId, useState } from 'react';
import type { BranchDto } from '@pos/shared';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Modal } from '../ui/Modal';

export interface BranchFormData {
  name: string;
  address?: string;
  phone?: string;
}

/** Nueva sucursal (`branch` null) o editar su nombre, dirección y teléfono. */
export function BranchFormModal({ branch, onClose, onSubmit }: {
  branch: BranchDto | null;
  onClose: () => void;
  onSubmit: (data: BranchFormData) => Promise<void>;
}) {
  const formId = useId();
  const [name, setName]       = useState(branch?.name ?? '');
  const [address, setAddress] = useState(branch?.address ?? '');
  const [phone, setPhone]     = useState(branch?.phone ?? '');
  const [saving, setSaving]   = useState(false);
  const valid = name.trim().length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid) return;
    setSaving(true);
    try {
      await onSubmit({ name: name.trim(), address: address.trim() || undefined, phone: phone.trim() || undefined });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={branch ? `Editar ${branch.name}` : 'Nueva sucursal'}
      size="sm"
      footer={
        <div className="flex gap-3">
          <Button type="button" variant="secondary" fullWidth onClick={onClose} disabled={saving}>Cancelar</Button>
          <Button type="submit" form={formId} fullWidth loading={saving} disabled={!valid}>
            {branch ? 'Guardar cambios' : 'Crear sucursal'}
          </Button>
        </div>
      }
    >
      <form id={formId} onSubmit={handleSubmit} className="space-y-4">
        <Input label="Nombre" autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej.: Sucursal Norte" />
        <Input label="Dirección (opcional)" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Ej.: Av. América #567" />
        <Input
          label="Teléfono (opcional)"
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="Ej.: 4 4551122"
          hint={branch ? undefined : 'Después le asignas cajeros desde Equipo.'}
        />
      </form>
    </Modal>
  );
}
