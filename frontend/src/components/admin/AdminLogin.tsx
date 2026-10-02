import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Icon } from '../ui/Icon';
import { PasswordInput } from '../ui/PasswordInput';

interface AdminLoginProps {
  keyInput: string;
  keyError: string;
  loading: boolean;
  onKeyChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}

/** Ingreso al panel de administración con la clave del servidor (`ADMIN_SECRET`). */
export function AdminLogin({ keyInput, keyError, loading, onKeyChange, onSubmit }: AdminLoginProps) {
  return (
    <div className="relative flex min-h-dvh items-center justify-center bg-surface-page px-4 py-10">
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -right-40 -top-40 h-[520px] w-[520px] rounded-full bg-primary-500/10 blur-[110px]" />
      </div>
      <div className="relative w-full max-w-sm animate-fade">
        <Card padding="lg">
          <div className="text-center">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-card bg-primary-500/10 text-primary-700 dark:text-primary-400">
              <Icon name="lock" size={26} />
            </span>
            <h1 className="mt-4 font-heading text-title font-bold text-main">Panel de administración</h1>
            <p className="mt-1 text-body text-soft">Solo para el equipo de YankoPOS.</p>
          </div>
          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <PasswordInput
              label="Clave de administrador"
              autoComplete="current-password"
              value={keyInput}
              onChange={onKeyChange}
              error={keyError || undefined}
            />
            <Button type="submit" fullWidth size="lg" loading={loading} disabled={!keyInput.trim()}>Entrar</Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
