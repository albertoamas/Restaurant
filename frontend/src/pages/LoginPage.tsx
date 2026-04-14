import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/auth.context';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import toast from 'react-hot-toast';
import { handleApiError } from '../utils/api-error';

export function LoginPage() {
  const BRAND_TAGLINE = 'Control total de tu negocio, en un solo lugar.';

  const { login, isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ email: '', password: '' });

  if (isAuthenticated) return <Navigate to="/pos" replace />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(form.email, form.password);
      toast.success('Bienvenido');
    } catch (err) {
      handleApiError(err, 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  return (
    <div className="min-h-svh relative overflow-hidden bg-[oklch(0.972_0.006_252)]">
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: [
            'radial-gradient(1200px 560px at 0% 0%, oklch(0.74 0.15 85 / 0.15), transparent 62%)',
            'radial-gradient(1000px 560px at 100% 100%, oklch(0.63 0.16 145 / 0.12), transparent 58%)',
            'linear-gradient(135deg, oklch(0.99 0.004 252), oklch(0.96 0.010 248))',
          ].join(','),
        }}
      />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(circle, oklch(0.75 0.010 255) 1px, transparent 1px)',
          backgroundSize: '28px 28px',
          maskImage: 'radial-gradient(ellipse 100% 100% at 50% 0%, black 10%, transparent 80%)',
        }}
      />

      <div className="relative z-10 min-h-svh p-4 sm:p-6 lg:p-8 flex items-center justify-center">
        <div className="w-full max-w-[430px] lg:max-w-6xl rounded-3xl overflow-hidden border border-white/70 shadow-[0_24px_60px_oklch(0.13_0.012_260/0.14)] bg-white/80 backdrop-blur-xl lg:grid lg:grid-cols-[1.05fr_0.95fr]">
          <section className="hidden lg:flex flex-col justify-between p-10 xl:p-12 relative overflow-hidden bg-[linear-gradient(165deg,oklch(0.36_0.16_236)_0%,oklch(0.20_0.09_252)_100%)] border-r border-white/20 text-white">
            <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full border border-white/15" />
            <div className="absolute -bottom-20 -left-14 w-72 h-72 rounded-full bg-white/10" />

            <div className="relative animate-slide stagger-1">
              <h1 className="font-heading font-black text-5xl leading-[1.02] tracking-tight text-white max-w-lg">
                Yanko<span className="opacity-70">POS</span>
              </h1>
              <p className="mt-3 text-sm text-white/80 max-w-md">
                {BRAND_TAGLINE}
              </p>

              <p className="mt-8 text-xs uppercase tracking-[0.16em] text-white/70 font-semibold">Panel Operativo</p>
              <h2 className="mt-2 text-3xl font-heading font-black text-white leading-tight max-w-md">
                Tu restaurante, en ritmo de servicio.
              </h2>
            </div>

            <div className="relative grid grid-cols-3 gap-3 text-xs animate-slide stagger-2">
              <div className="rounded-xl border border-white/20 bg-white/10 px-3 py-3">
                <p className="text-white/70">Pedidos</p>
                <p className="font-bold text-base mt-1 text-white">Continuos</p>
              </div>
              <div className="rounded-xl border border-white/20 bg-white/10 px-3 py-3">
                <p className="text-white/70">Caja</p>
                <p className="font-bold text-base mt-1 text-white">Controlada</p>
              </div>
              <div className="rounded-xl border border-white/20 bg-white/10 px-3 py-3">
                <p className="text-white/70">Cocina</p>
                <p className="font-bold text-base mt-1 text-white">Sin fricción</p>
              </div>
            </div>
          </section>

          <section className="p-6 sm:p-8 lg:p-10 bg-white/88 min-h-0 flex flex-col justify-center lg:block">
            <div className="lg:hidden mb-6">
              <div className="flex items-center gap-3 mb-2.5">
                <div className="w-11 h-11 rounded-xl bg-primary-600 text-white flex items-center justify-center shadow-[0_8px_18px_oklch(0.47_0.17_234/0.28)]">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
                  </svg>
                </div>
                <div>
                  <h1 className="font-heading font-black text-2xl text-gray-900 tracking-tight">YankoPOS</h1>
                  <p className="text-[11px] text-gray-500 leading-snug max-w-[22rem]">{BRAND_TAGLINE}</p>
                </div>
              </div>
            </div>

            <div className="max-w-sm mx-auto lg:mx-0 lg:max-w-md">
              <p className="text-xs uppercase tracking-[0.17em] text-primary-700 font-semibold mb-2">Acceso Seguro</p>
              <h2 className="text-3xl font-heading font-black text-gray-900 tracking-tight">Bienvenido a YankoPOS</h2>
              <p className="text-sm text-gray-500 mt-1 mb-6">Control total de tu negocio, en un solo lugar.</p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                  label="Correo electrónico"
                  type="email"
                  placeholder="correo@tu-negocio.bo"
                  value={form.email}
                  onChange={set('email')}
                  inputSize="lg"
                  required
                />
                <Input
                  label="Contraseña"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={form.password}
                  onChange={set('password')}
                  inputSize="lg"
                  rightAddon={(
                    <button
                      type="button"
                      aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="-mr-1 p-1 rounded-md hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors"
                    >
                      {showPassword ? (
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.542-7a9.956 9.956 0 012.223-3.592m3.198-2.226A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.542 7a9.965 9.965 0 01-4.312 5.411M15 12a3 3 0 11-6 0 3 3 0 016 0zm6 9L3 3" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M2.458 12C3.732 7.943 7.522 5 12 5s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7s-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                  )}
                  required
                />
                <Button type="submit" fullWidth size="lg" loading={loading}>
                  {loading ? 'Entrando...' : 'Entrar al panel'}
                </Button>
              </form>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
