import { useState } from 'react';
import toast from 'react-hot-toast';
import { UserRole } from '@pos/shared';
import { useAuth } from '../context/auth.context';
import { usersApi } from '../api/users.api';
import { useBranchNames } from '../hooks/useBranches';
import { useTheme } from '../hooks/useTheme';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Icon } from '../components/ui/Icon';
import { PageHeader } from '../components/ui/PageHeader';
import { PageShell } from '../components/ui/PageShell';
import { PasswordInput } from '../components/ui/PasswordInput';
import { SegmentedControl } from '../components/ui/SegmentedControl';
import { handleApiError } from '../utils/api-error';
import { MIN_PASSWORD_LENGTH, validatePasswordForm, type PasswordForm } from '../utils/password-form';

const EMPTY: PasswordForm = { currentPassword: '', newPassword: '', confirmPassword: '' };

/** Mismas etiquetas que la pantalla Equipo. */
const ROLE_LABEL: Record<string, string> = {
  [UserRole.OWNER]:   'Dueño',
  [UserRole.CASHIER]: 'Cajero',
};

function ProfileRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-2.5">
      <dt className="text-label text-soft">{label}</dt>
      <dd className="text-body text-main text-right min-w-0 truncate">{value}</dd>
    </div>
  );
}

export function CashierAccountPage() {
  const { user, logout } = useAuth();
  const { branchName } = useBranchNames();
  const { theme, setTheme } = useTheme();
  const [pw, setPw]           = useState<PasswordForm>(EMPTY);
  const [loading, setLoading] = useState(false);

  const isOwner   = user?.role === UserRole.OWNER;
  const initial   = (user?.name ?? '?')[0].toUpperCase();
  const roleLabel = ROLE_LABEL[user?.role ?? ''] ?? '';
  // El dueño no tiene una sucursal fija: trabaja con todas.
  const branch    = isOwner ? 'Todas las sucursales' : (branchName(user?.branchId) ?? '-');

  const { errors, valid } = validatePasswordForm(pw);
  const set = (field: keyof PasswordForm) => (v: string) => setPw((p) => ({ ...p, [field]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid) return;
    setLoading(true);
    try {
      await usersApi.changePassword({
        currentPassword: pw.currentPassword,
        newPassword:     pw.newPassword,
      });
      toast.success('Contraseña actualizada');
      setPw(EMPTY);
    } catch (err) {
      handleApiError(err, 'Error al cambiar contraseña');
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageShell>
      <div className="max-w-2xl">
        <PageHeader title="Mi cuenta" description="Tus datos, tu contraseña y cómo se ve la app en este equipo." />

        <div className="space-y-4">
          <Card>
            <div className="flex items-center gap-4">
              <span className="w-14 h-14 shrink-0 rounded-full bg-primary-500/12 border border-primary-500/25 flex items-center justify-center text-title font-bold text-primary-700 dark:text-primary-400">
                {initial}
              </span>
              <div className="min-w-0">
                <p className="text-heading font-semibold text-main truncate">{user?.name}</p>
                <p className="text-body text-soft truncate">{user?.email}</p>
              </div>
            </div>
            <dl className="mt-4 divide-y divide-line border-t border-line">
              <ProfileRow label="Rol" value={roleLabel} />
              <ProfileRow label="Negocio" value={user?.tenantName ?? '-'} />
              <ProfileRow label="Sucursal" value={branch} />
            </dl>
          </Card>

          <Card>
            <h2 className="text-heading font-semibold text-main">Cambiar contraseña</h2>
            <p className="text-label text-soft mt-0.5">Tu sesión en este equipo sigue abierta después del cambio.</p>
            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              <PasswordInput
                label="Contraseña actual"
                autoComplete="current-password"
                value={pw.currentPassword}
                onChange={set('currentPassword')}
              />
              <PasswordInput
                label="Nueva contraseña"
                autoComplete="new-password"
                value={pw.newPassword}
                onChange={set('newPassword')}
                error={errors.newPassword}
                hint={`Al menos ${MIN_PASSWORD_LENGTH} caracteres.`}
              />
              <PasswordInput
                label="Repite la nueva contraseña"
                autoComplete="new-password"
                value={pw.confirmPassword}
                onChange={set('confirmPassword')}
                error={errors.confirmPassword}
              />
              <Button type="submit" loading={loading} disabled={!valid} className="w-full sm:w-auto">
                Cambiar contraseña
              </Button>
            </form>
          </Card>

          <Card>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h2 className="text-heading font-semibold text-main">Apariencia</h2>
                <p className="text-label text-soft mt-0.5">Se guarda en este equipo. También se cambia desde la barra superior.</p>
              </div>
              <SegmentedControl
                label="Tema"
                value={theme}
                onChange={setTheme}
                options={[{ value: 'light', label: 'Claro' }, { value: 'dark', label: 'Oscuro' }]}
              />
            </div>
          </Card>

          <Button variant="secondary" onClick={logout} className="w-full sm:w-auto">
            <Icon name="logout" size={18} />
            Cerrar sesión
          </Button>
        </div>
      </div>
    </PageShell>
  );
}
