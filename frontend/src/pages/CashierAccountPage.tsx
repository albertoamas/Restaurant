import { useState } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/auth.context';
import { usersApi } from '../api/users.api';
import { adminApi } from '../api/admin.api';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { handleApiError } from '../utils/api-error';

const ACCOUNT_UNLOCK_KEY = 'pos_account_unlocked';
const EMPTY = { currentPassword: '', newPassword: '', confirmPassword: '' };

function AccountLock({ onUnlock }: { onUnlock: () => void }) {
  const [key, setKey]       = useState('');
  const [error, setError]   = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await adminApi.ping(key.trim());
      sessionStorage.setItem(ACCOUNT_UNLOCK_KEY, '1');
      onUnlock();
    } catch {
      setError('Clave incorrecta');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-sm mx-auto mt-16 animate-in">
      <div className="rounded-2xl border border-white/70 bg-white/80 backdrop-blur-xl shadow-[0_10px_30px_oklch(0.13_0.012_260/0.10)] p-8 text-center">
        <div className="w-14 h-14 rounded-2xl bg-primary-100 border border-primary-200 flex items-center justify-center mx-auto mb-5">
          <svg className="w-7 h-7 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <h2 className="font-heading font-black text-xl text-gray-900 mb-1">Acción protegida</h2>
        <p className="text-sm text-gray-500 mb-6">
          Ingresa la clave del administrador para cambiar la contraseña.
        </p>
        <form onSubmit={handleSubmit} className="space-y-3 text-left">
          <Input
            label="Clave de administrador"
            type="password"
            placeholder="••••••••"
            value={key}
            onChange={(e) => { setKey(e.target.value); setError(''); }}
            autoFocus
            required
          />
          {error && <p className="text-xs text-red-500 font-medium">{error}</p>}
          <Button type="submit" fullWidth loading={loading}>
            {loading ? 'Verificando...' : 'Desbloquear'}
          </Button>
        </form>
      </div>
    </div>
  );
}

export function CashierAccountPage() {
  const { user } = useAuth();
  const [unlocked, setUnlocked] = useState(
    () => sessionStorage.getItem(ACCOUNT_UNLOCK_KEY) === '1',
  );
  const [pw, setPw]           = useState(EMPTY);
  const [loading, setLoading] = useState(false);
  const userInitial            = (user?.name ?? '?')[0].toUpperCase();

  if (!unlocked) {
    return <AccountLock onUnlock={() => setUnlocked(true)} />;
  }

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
    <div className="p-4 sm:p-6 max-w-lg mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-heading font-black text-gray-900">Mi cuenta</h1>
        <p className="text-sm text-gray-500 mt-1">Información de tu perfil</p>
      </div>

      {/* Profile card */}
      <Card className="mb-4 p-5 flex items-center gap-4">
        <div className="w-12 h-12 rounded-full bg-primary-100 border border-primary-200 flex items-center justify-center shrink-0">
          <span className="text-xl font-bold text-primary-600">{userInitial}</span>
        </div>
        <div className="min-w-0">
          <p className="font-semibold text-gray-900 truncate">{user?.name}</p>
          <p className="text-sm text-gray-500 truncate">{user?.email}</p>
          {user?.role === 'CASHIER' && (
            <span className="inline-block mt-1 text-xs font-medium text-primary-600 bg-primary-50 border border-primary-100 px-2 py-0.5 rounded-full">
              Cajero
            </span>
          )}
        </div>
      </Card>

      {/* Change password card */}
      <Card className="p-5">
        <h2 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          Cambiar contraseña
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Contraseña actual"
            type="password"
            autoComplete="current-password"
            value={pw.currentPassword}
            onChange={(e) => setPw({ ...pw, currentPassword: e.target.value })}
            required
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
          <div className="pt-1">
            <Button type="submit" loading={loading}>
              Guardar cambios
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
