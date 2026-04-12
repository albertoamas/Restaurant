interface AdminLoginProps {
  keyInput: string;
  keyError: string;
  onKeyChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export function AdminLogin({ keyInput, keyError, onKeyChange, onSubmit }: AdminLoginProps) {
  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 bg-[oklch(0.10_0.015_255)]"
      style={{
        backgroundImage: 'radial-gradient(circle, oklch(0.18 0.015 255) 1px, transparent 1px)',
        backgroundSize: '24px 24px',
      }}
    >
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 60% 40% at 50% 0%, oklch(0.47 0.17 234 / 0.15), transparent 70%)' }}
      />

      <div className="relative w-full max-w-xs animate-in">
        <div className="flex flex-col items-center mb-5">
          <div className="w-14 h-14 rounded-2xl bg-[oklch(0.18_0.018_255)] border border-white/10 flex items-center justify-center mb-3 shadow-[0_8px_32px_oklch(0_0_0/0.5)]">
            <svg className="w-7 h-7 text-white/80" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h1 className="font-heading font-black text-xl text-white tracking-tight">Admin Console</h1>
          <p className="text-xs text-white/35 mt-0.5 tracking-wide">Acceso restringido</p>
        </div>

        <div
          className="rounded-2xl border border-white/10 overflow-hidden shadow-[0_24px_48px_oklch(0_0_0/0.5)]"
          style={{ background: 'oklch(0.14 0.016 255 / 0.85)', backdropFilter: 'blur(20px)' }}
        >
          <form onSubmit={onSubmit} className="p-6 space-y-4">
            <div>
              <label className="block text-xs font-medium text-white/50 mb-1.5 tracking-wide">
                Clave de administrador
              </label>
              <input
                type="password"
                value={keyInput}
                onChange={(e) => onKeyChange(e.target.value)}
                placeholder="••••••••••••"
                className="w-full rounded-xl px-3 py-2.5 text-sm text-white placeholder-white/25 bg-white/8 border border-white/12 focus:outline-none focus:ring-2 focus:ring-primary-400/40 focus:border-primary-400/40 transition-all"
                autoFocus
              />
            </div>

            {keyError && (
              <div className="flex items-center gap-1.5 text-xs text-red-400">
                <svg className="w-3.5 h-3.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                {keyError}
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-primary-600 hover:bg-primary-500 active:brightness-95 text-white font-semibold text-sm py-2.5 rounded-xl transition-colors"
            >
              Entrar al panel
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
