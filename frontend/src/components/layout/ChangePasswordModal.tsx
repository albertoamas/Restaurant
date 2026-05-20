import { useState } from 'react';
import toast from 'react-hot-toast';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { usersApi } from '../../api/users.api';
import { handleApiError } from '../../utils/api-error';

interface Props {
  open: boolean;
  onClose: () => void;
}

const EMPTY = { currentPassword: '', newPassword: '', confirmPassword: '' };

export function ChangePasswordModal({ open, onClose }: Props) {
  const [pw, setPw]       = useState(EMPTY);
  const [loading, setLoading] = useState(false);

  const handleClose = () => {
    setPw(EMPTY);
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pw.newPassword !== pw.confirmPassword) {
      toast.error('Las contraseñas nuevas no coinciden');
      return;
    }
    setLoading(true);
    try {
      await usersApi.changePassword({
        currentPassword: pw.currentPassword,
        newPassword: pw.newPassword,
      });
      toast.success('Contraseña actualizada');
      handleClose();
    } catch (err) {
      handleApiError(err, 'Error al cambiar contraseña');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={open} onClose={handleClose} title="Cambiar contraseña">
      <form onSubmit={handleSubmit} className="space-y-4 mt-1">
        <Input
          label="Contraseña actual"
          type="password"
          autoComplete="current-password"
          value={pw.currentPassword}
          onChange={(e) => setPw({ ...pw, currentPassword: e.target.value })}
          required
          autoFocus
        />
        <Input
          label="Nueva contraseña"
          type="password"
          autoComplete="new-password"
          value={pw.newPassword}
          onChange={(e) => setPw({ ...pw, newPassword: e.target.value })}
          minLength={6}
          required
        />
        <Input
          label="Confirmar nueva contraseña"
          type="password"
          autoComplete="new-password"
          value={pw.confirmPassword}
          onChange={(e) => setPw({ ...pw, confirmPassword: e.target.value })}
          minLength={6}
          required
        />
        <div className="flex gap-2 pt-1">
          <Button type="button" variant="ghost" onClick={handleClose} disabled={loading} fullWidth>
            Cancelar
          </Button>
          <Button type="submit" loading={loading} fullWidth>
            Guardar
          </Button>
        </div>
      </form>
    </Modal>
  );
}
