import { Icon } from '../ui/Icon';

interface AdminLoginProps {
  keyInput: string;
  keyError: string;
  onKeyChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export function AdminLogin({ keyInput, keyError, onKeyChange, onSubmit }: AdminLoginProps) {
  return (
    <div
      className="relative min-h-screen flex items-center justify-center overflow-hidden p-4"
      style={{
        background: 'var(--color-surface-page)',
        backgroundImage: 'radial-gradient(circle, var(--border-subtle) 1px, transparent 1px)',
        backgroundSize: '26px 26px',
      }}
    >
      {/* Halo de marca, centrado sobre la tarjeta */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{ background: 'radial-gradient(ellipse 55% 45% at 50% 38%, oklch(0.55 0.20 42 / 0.10), transparent 70%)' }}
      />

      <div className="relative w-full max-w-[23rem] animate-in">
        <div className="flex flex-col items-center mb-7 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-[1.25rem] border border-primary-500/20 bg-primary-500/10">
            <Icon name="lock" size={26} strokeWidth={1.5} className="text-primary-500" />
          </div>
          <p className="mb-1.5 font-mono text-[10px] font-semibold uppercase tracking-[0.25em] text-primary-500/80">
            Panel interno
          </p>
          <h1 className="font-heading font-black text-2xl text-[var(--color-text-main)] tracking-tight">Admin Console</h1>
          <p className="mt-1 text-xs text-[var(--color-text-muted)]">Solo personal autorizado de YankoPOS</p>
        </div>

        <div
          className="overflow-hidden rounded-[1.5rem] border border-[var(--border-subtle)]"
          style={{ background: 'var(--color-surface-card)' }}
        >
          <form onSubmit={onSubmit} className="p-7 space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-medium tracking-wide text-[var(--color-text-soft)]">
                Clave de administrador
              </label>
              <div className="relative">
                <Icon
                  name="lock"
                  size={15}
                  strokeWidth={2}
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]"
                />
                <input
                  type="password"
                  value={keyInput}
                  onChange={(e) => onKeyChange(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full rounded-xl border border-[var(--border-subtle)] py-[0.69rem] pl-10 pr-3.5 text-sm text-[var(--color-text-main)] placeholder:text-[var(--color-text-muted)] transition-colors focus:border-primary-500/50 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                  style={{ background: 'var(--color-surface-2)' }}
                  autoFocus
                />
              </div>
            </div>

            {keyError && (
              <div className="flex items-center gap-1.5 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-500">
                <Icon name="warning" size={14} strokeWidth={2} className="shrink-0" />
                {keyError}
              </div>
            )}

            <button
              type="submit"
              className="w-full rounded-xl bg-primary-600 py-[0.69rem] text-sm font-semibold text-white transition-colors hover:bg-primary-500 active:scale-[0.98] active:brightness-95"
            >
              Entrar al panel
            </button>
          </form>
        </div>

        <p className="mt-5 text-center text-[11px] text-[var(--color-text-muted)]">
          Este acceso queda registrado. Uso exclusivo de operaciones YankoPOS.
        </p>
      </div>
    </div>
  );
}
