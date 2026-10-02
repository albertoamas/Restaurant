import { useId, useState } from 'react';
import { Button } from './Button';
import { Modal } from './Modal';
import { PasswordInput } from './PasswordInput';
import { MIN_PASSWORD_LENGTH, newPasswordErrors } from '../../utils/password-form';

/**
 * Ponerle una contraseña nueva a otra persona (el dueño a un cajero, el admin a un dueño), por
 * ejemplo si la olvidó. Se monta al abrir.
 */
export function NewPasswordModal({ name, onClose, onSubmit }: {
  /** De quién es la contraseña: va en el título. */
  name: string;
  onClose: () => void;
  onSubmit: (newPassword: string) => Promise<void>;
}) {
  const formId = useId();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm]   = useState('');
  const [saving, setSaving]     = useState(false);
  const { errors, valid } = newPasswordErrors(password, confirm);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid) return;
    setSaving(true);
    try { await onSubmit(password); } finally { setSaving(false); }
  };

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={`Nueva contraseña para ${name}`}
      size="sm"
      footer={
        <div className="flex gap-3">
          <Button type="button" variant="secondary" fullWidth onClick={onClose} disabled={saving}>Cancelar</Button>
          <Button type="submit" form={formId} fullWidth loading={saving} disabled={!valid}>Cambiar contraseña</Button>
        </div>
      }
    >
      <form id={formId} onSubmit={handleSubmit} className="space-y-4">
        <p className="text-label text-soft">La anterior deja de funcionar. Compártele la nueva por un medio seguro.</p>
        <PasswordInput label="Contraseña nueva" autoComplete="new-password" value={password} onChange={setPassword} error={errors.password} hint={`Al menos ${MIN_PASSWORD_LENGTH} caracteres.`} />
        <PasswordInput label="Repite la contraseña" autoComplete="new-password" value={confirm} onChange={setConfirm} error={errors.confirm} />
      </form>
    </Modal>
  );
}
