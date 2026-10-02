import { useId, useState } from 'react';
import type { BranchDto } from '@pos/shared';
import type { UserDto } from '../../api/users.api';
import { Button } from '../ui/Button';
import { Input, Select } from '../ui/Input';
import { Modal } from '../ui/Modal';
import { PasswordInput } from '../ui/PasswordInput';
import { MIN_PASSWORD_LENGTH, newPasswordErrors } from '../../utils/password-form';

/** Nuevo cajero (con contraseña y sucursal) o editar su nombre y correo. */
export function CashierFormModal({ user, branches, onClose, onSubmit }: {
  user: UserDto | null;
  branches: BranchDto[];
  onClose: () => void;
  onSubmit: (data: { name: string; email: string; password?: string; branchId?: string }) => Promise<void>;
}) {
  const formId = useId();
  const editing = user !== null;
  const [name, setName]         = useState(user?.name ?? '');
  const [email, setEmail]       = useState(user?.email ?? '');
  const [password, setPassword] = useState('');
  const [branchId, setBranchId] = useState(branches.length === 1 ? branches[0].id : '');
  const [saving, setSaving]     = useState(false);

  const { errors } = newPasswordErrors(password);
  const valid = name.trim().length >= 2 && email.trim() !== '' && (editing || password.length >= MIN_PASSWORD_LENGTH);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid) return;
    setSaving(true);
    try {
      await onSubmit(editing
        ? { name: name.trim(), email: email.trim() }
        : { name: name.trim(), email: email.trim(), password, branchId: branchId || undefined });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={editing ? `Editar a ${user.name}` : 'Nuevo cajero'}
      size="sm"
      footer={
        <div className="flex gap-3">
          <Button type="button" variant="secondary" fullWidth onClick={onClose} disabled={saving}>Cancelar</Button>
          <Button type="submit" form={formId} fullWidth loading={saving} disabled={!valid}>
            {editing ? 'Guardar cambios' : 'Crear cajero'}
          </Button>
        </div>
      }
    >
      <form id={formId} onSubmit={handleSubmit} className="space-y-4">
        <Input label="Nombre completo" autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej.: Marcela Rojas" />
        <Input label="Correo" type="email" autoComplete="off" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Con este correo inicia sesión" />
        {!editing && (
          <>
            <PasswordInput
              label="Contraseña"
              autoComplete="new-password"
              value={password}
              onChange={setPassword}
              error={errors.password}
              hint={`Al menos ${MIN_PASSWORD_LENGTH} caracteres. Compártela con el cajero.`}
            />
            {branches.length > 0 && (
              <Select label="Sucursal" value={branchId} onChange={(e) => setBranchId(e.target.value)} hint="Puedes asignarla o cambiarla después.">
                <option value="">Sin sucursal por ahora</option>
                {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
              </Select>
            )}
          </>
        )}
      </form>
    </Modal>
  );
}

