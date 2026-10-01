import { useState } from 'react';
import { adminApi } from '../../api/admin.api';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Icon } from '../ui/Icon';
import { PasswordInput } from '../ui/PasswordInput';

export const SETTINGS_UNLOCK_KEY = 'pos_settings_unlocked';

/** Pide la clave de administrador antes de mostrar la configuración (queda abierta en esta pestaña). */
export function SettingsLock({ onUnlock }: { onUnlock: () => void }) {
  const [key, setKey]         = useState('');
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!key.trim()) return;
    setError('');
    setLoading(true);
    try {
      await adminApi.ping(key.trim());
      sessionStorage.setItem(SETTINGS_UNLOCK_KEY, '1');
      onUnlock();
    } catch {
      setError('Clave incorrecta');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto mt-10 max-w-sm px-4 sm:mt-16 animate-in">
      <Card padding="lg">
        <div className="text-center">
          <span className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-card bg-primary-500/10 text-primary-700 dark:text-primary-400">
            <Icon name="lock" size={26} />
          </span>
          <h1 className="font-heading text-title font-bold text-main">Configuración protegida</h1>
          <p className="mt-1 text-body text-soft">Ingresa la clave de administrador para ver y cambiar estos ajustes.</p>
        </div>
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <PasswordInput
            label="Clave de administrador"
            autoComplete="current-password"
            value={key}
            onChange={(v) => { setKey(v); setError(''); }}
            error={error || undefined}
          />
          <Button type="submit" fullWidth loading={loading} disabled={!key.trim()}>Desbloquear</Button>
        </form>
      </Card>
    </div>
  );
}
