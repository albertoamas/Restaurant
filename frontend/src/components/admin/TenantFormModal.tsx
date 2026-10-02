import { useId, useState } from 'react';
import type { CreateTenantPayload } from '../../api/admin.api';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Modal } from '../ui/Modal';
import { PasswordInput } from '../ui/PasswordInput';
import { MIN_PASSWORD_LENGTH, newPasswordErrors } from '../../utils/password-form';

const EMPTY: CreateTenantPayload = { businessName: '', ownerName: '', email: '', password: '', branchName: '' };

/**
 * Alta de un negocio con su dueño y su primera sucursal (todo en una transacción en el backend).
 * Los mínimos replican RegisterDto: si no coinciden, el servidor responde en inglés.
 */
export function TenantFormModal({ onClose, onSubmit }: {
  onClose: () => void;
  onSubmit: (data: CreateTenantPayload) => Promise<void>;
}) {
  const formId = useId();
  const [form, setForm] = useState<CreateTenantPayload>(EMPTY);
  const [saving, setSaving] = useState(false);
  const set = (key: keyof CreateTenantPayload) => (v: string) => setForm((prev) => ({ ...prev, [key]: v }));

  const branch = form.branchName?.trim() ?? '';
  const valid = form.businessName.trim().length >= 2 && form.ownerName.trim().length >= 2
    && form.email.trim() !== '' && form.password.length >= MIN_PASSWORD_LENGTH
    && (branch === '' || branch.length >= 2);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid) return;
    setSaving(true);
    try {
      await onSubmit({
        businessName: form.businessName.trim(),
        ownerName:    form.ownerName.trim(),
        email:        form.email.trim(),
        password:     form.password,
        branchName:   branch || undefined,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      isOpen
      onClose={onClose}
      title="Nuevo negocio"
      size="md"
      footer={
        <div className="flex gap-3">
          <Button type="button" variant="secondary" fullWidth onClick={onClose} disabled={saving}>Cancelar</Button>
          <Button type="submit" form={formId} fullWidth loading={saving} disabled={!valid}>Crear negocio</Button>
        </div>
      }
    >
      <form id={formId} onSubmit={submit} className="space-y-4">
        <p className="text-label text-soft">Se crea en el plan Básico con su dueño y su primera sucursal. El plan se cambia después en su ficha.</p>
        <Input label="Nombre del negocio" autoFocus value={form.businessName} onChange={(e) => set('businessName')(e.target.value)} placeholder="Ej.: HamBurgos" maxLength={100} />
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Nombre del dueño" value={form.ownerName} onChange={(e) => set('ownerName')(e.target.value)} placeholder="Ej.: Juan Pérez" maxLength={100} />
          <Input label="Correo del dueño" type="email" autoComplete="off" value={form.email} onChange={(e) => set('email')(e.target.value)} placeholder="Con este correo inicia sesión" />
        </div>
        <PasswordInput
          label="Contraseña inicial"
          autoComplete="new-password"
          value={form.password}
          onChange={set('password')}
          error={newPasswordErrors(form.password).errors.password}
          hint="Compártela con el dueño; puede cambiarla en Mi cuenta."
        />
        <Input label="Primera sucursal (opcional)" value={form.branchName ?? ''} onChange={(e) => set('branchName')(e.target.value)} placeholder="Si lo dejas vacío: Principal" maxLength={100} />
      </form>
    </Modal>
  );
}
