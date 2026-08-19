import { useState } from 'react';
import { Navigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/auth.context';
import { Icon } from '../components/ui/Icon';
import toast from 'react-hot-toast';
import { getApiErrorMessage } from '../utils/api-error';

export function LoginPage() {
  const BRAND_TAGLINE = 'Control total de tu negocio, en un solo lugar.';

  const { login, isAuthenticated } = useAuth();
  const [loading, setLoading]         = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm]               = useState({ email: '', password: '' });
  const [remember, setRemember]       = useState(true);
  const [errorMsg, setErrorMsg]       = useState<string | null>(null);

  if (isAuthenticated) return <Navigate to="/pos" replace />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);
    try {
      await login(form.email, form.password, remember);
      toast.success('Bienvenido');
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const status = err.response?.status;
        if (status === 401) {
          setErrorMsg('Correo o contraseña incorrectos.');
        } else if (status === 429) {
          setErrorMsg('Demasiados intentos fallidos. Espera un momento e intenta de nuevo.');
        } else {
          setErrorMsg(getApiErrorMessage(err, 'Error al conectar con el servidor.'));
        }
      } else {
        setErrorMsg('Error inesperado. Intenta de nuevo.');
      }
    } finally {
      setLoading(false);
    }
  };

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
    setErrorMsg(null);
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 sm:p-6 lg:p-8 bg-[var(--color-surface-page)] overflow-hidden">
      
      {/* Background Decorators (Aurora effect, mostly visible in dark mode, adapts via css) */}
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-primary-500/10 rounded-full blur-[120px] pointer-events-none -translate-y-1/3 translate-x-1/3" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-primary-500/5 rounded-full blur-[100px] pointer-events-none translate-y-1/3 -translate-x-1/3" />

      {/* Back button (optional return to landing) */}
      <Link to="/" className="absolute top-6 left-6 flex items-center gap-2 text-sm font-medium text-[var(--color-text-soft)] hover:text-[var(--color-text-main)] transition-colors z-20">
        <Icon name="arrow-left" size={16} />
        <span className="hidden sm:inline">Volver al inicio</span>
      </Link>

      <div className="relative z-10 w-full max-w-[1000px] bg-[var(--color-surface-card)] rounded-[32px] overflow-hidden border border-[var(--border-subtle)] shadow-card-xl lg:flex animate-fade">
        
        {/* LEFT — Brand panel (Hidden on small screens) */}
        <section className="hidden lg:flex flex-1 flex-col justify-between p-12 relative overflow-hidden bg-[var(--color-surface-2)] border-r border-[var(--border-subtle)]">
          {/* Internal decorators */}
          <div className="absolute -top-32 -right-32 w-[400px] h-[400px] rounded-full bg-primary-500/20 blur-[80px] pointer-events-none" />
          
          <div className="relative z-10 animate-slide">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-xl bg-primary-500 flex items-center justify-center shadow-lg shadow-primary-500/25">
                <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" />
                </svg>
              </div>
              <span className="font-heading font-black text-2xl tracking-tight text-[var(--color-text-main)]">
                Yanko<span className="text-primary-500">POS</span>
              </span>
            </div>

            <p className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-[var(--border-strong)] bg-[var(--color-surface-3)] text-[11px] font-bold text-[var(--color-text-soft)] uppercase tracking-[0.15em] mb-4">
              Panel Operativo
            </p>
            <h2 className="text-4xl font-heading font-black leading-[1.1] text-[var(--color-text-main)] max-w-[320px]">
              Tu restaurante, en ritmo de servicio.
            </h2>
            <p className="mt-4 text-[15px] text-[var(--color-text-soft)] leading-relaxed max-w-[320px]">
              {BRAND_TAGLINE}
            </p>
          </div>

          {/* Feature highlights */}
          <div className="relative z-10 grid grid-cols-1 gap-3 mt-12 animate-slide stagger-1">
            {[
              { label: 'Pedidos rápidos', value: 'Flujo optimizado para pantallas táctiles.', icon: 'cart' },
              { label: 'Sincronización en tiempo real', value: 'Cocina y caja siempre actualizados.', icon: 'refresh' },
              { label: 'Control de caja seguro', value: 'Arqueos y cierres sin descuadres.', icon: 'lock' },
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-4 p-4 rounded-2xl bg-[var(--color-surface-card)]/50 backdrop-blur-sm border border-[var(--border-subtle)]">
                <div className="w-10 h-10 rounded-xl bg-primary-500/10 text-primary-500 flex items-center justify-center shrink-0">
                  <Icon name={item.icon as any} size={20} strokeWidth={1.5} />
                </div>
                <div>
                  <p className="text-sm font-bold text-[var(--color-text-main)]">{item.label}</p>
                  <p className="text-[13px] text-[var(--color-text-muted)] mt-0.5">{item.value}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* RIGHT — Form panel */}
        <section className="flex-1 p-8 sm:p-12 lg:p-16 flex flex-col justify-center">
          
          {/* Mobile brand (Only visible when Left Panel is hidden) */}
          <div className="lg:hidden flex items-center gap-3 mb-10">
            <div className="w-10 h-10 rounded-xl bg-primary-500 flex items-center justify-center shadow-md shadow-primary-500/20">
              <Icon name="cart" size={20} strokeWidth={2} className="text-white" />
            </div>
            <div>
              <h1 className="font-heading font-black text-2xl tracking-tight text-[var(--color-text-main)]">
                Yanko<span className="text-primary-500">POS</span>
              </h1>
              <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                Panel Operativo
              </p>
            </div>
          </div>

          <div className="w-full max-w-[360px] mx-auto lg:mx-0 lg:ml-auto lg:mr-8 animate-slide stagger-2">
            <h2 className="text-3xl font-heading font-black tracking-tight text-[var(--color-text-main)] mb-2">
              Bienvenido
            </h2>
            <p className="text-[14.5px] text-[var(--color-text-soft)] mb-8">
              Ingresa tus credenciales para continuar.
            </p>

            <form onSubmit={handleSubmit} className="space-y-5">
              
              {/* Email Input */}
              <div className="space-y-1.5">
                <label className="text-[13px] font-semibold text-[var(--color-text-soft)] ml-1">
                  Correo electrónico
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-[var(--color-text-muted)] group-focus-within:text-primary-500 transition-colors">
                    <Icon name="user" size={18} strokeWidth={1.5} />
                  </div>
                  <input
                    type="email"
                    name="email"
                    autoComplete="email"
                    placeholder="correo@ejemplo.com"
                    value={form.email}
                    onChange={set('email')}
                    required
                    className="w-full pl-11 pr-4 py-3.5 text-[15px] bg-[var(--color-surface-2)] border border-[var(--border-subtle)] rounded-2xl text-[var(--color-text-main)] placeholder:text-[var(--color-text-muted)]/50 focus:outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 transition-all"
                  />
                </div>
              </div>

              {/* Password Input */}
              <div className="space-y-1.5">
                <label className="text-[13px] font-semibold text-[var(--color-text-soft)] ml-1">
                  Contraseña
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-[var(--color-text-muted)] group-focus-within:text-primary-500 transition-colors">
                    <Icon name="lock" size={18} strokeWidth={1.5} />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    autoComplete="current-password"
                    placeholder="••••••••"
                    value={form.password}
                    onChange={set('password')}
                    required
                    className="w-full pl-11 pr-12 py-3.5 text-[15px] bg-[var(--color-surface-2)] border border-[var(--border-subtle)] rounded-2xl text-[var(--color-text-main)] placeholder:text-[var(--color-text-muted)]/50 focus:outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 transition-all"
                  />
                  <button
                    type="button"
                    aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-[var(--color-text-muted)] hover:text-[var(--color-text-main)] transition-colors p-2"
                  >
                    <Icon name={showPassword ? 'eye-off' : 'eye'} size={18} strokeWidth={1.5} />
                  </button>
                </div>
              </div>

              {/* Remember me & Forgot password row */}
              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2.5 cursor-pointer group">
                  <div className="relative flex items-center justify-center">
                    <input
                      type="checkbox"
                      checked={remember}
                      onChange={(e) => setRemember(e.target.checked)}
                      className="peer sr-only"
                    />
                    <div className="w-[18px] h-[18px] rounded-md border-2 border-[var(--border-strong)] bg-transparent peer-checked:bg-primary-500 peer-checked:border-primary-500 transition-all flex items-center justify-center">
                      <Icon name="check" size={12} strokeWidth={3} className="text-white scale-0 peer-checked:scale-100 transition-transform duration-200" />
                    </div>
                  </div>
                  <span className="text-[13px] font-medium text-[var(--color-text-soft)] select-none group-hover:text-[var(--color-text-main)] transition-colors">
                    Recordar sesión
                  </span>
                </label>
                
                <button type="button" className="text-[13px] font-semibold text-primary-500 hover:text-primary-600 transition-colors">
                  ¿Olvidaste tu contraseña?
                </button>
              </div>

              {/* Error Message */}
              {errorMsg && (
                <div className="flex items-start gap-2.5 p-3.5 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 animate-in text-[13px] font-medium">
                  <Icon name="warning" size={16} strokeWidth={2} className="shrink-0 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className={`w-full py-3.5 rounded-2xl text-[15px] font-bold text-white transition-all duration-200 active:scale-[0.98] mt-4 flex items-center justify-center gap-2 ${
                  loading 
                    ? 'bg-primary-400 cursor-not-allowed' 
                    : 'bg-primary-500 hover:bg-primary-600 shadow-[0_4px_14px_oklch(0.65_0.22_42/0.3)] hover:shadow-[0_6px_20px_oklch(0.65_0.22_42/0.4)]'
                }`}
              >
                {loading ? (
                  <>
                    <span className="w-5 h-5 border-[2.5px] border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Entrando...</span>
                  </>
                ) : (
                  <>
                    <span>Entrar al panel</span>
                    <Icon name="arrow-right" size={18} strokeWidth={2} />
                  </>
                )}
              </button>
              
            </form>
          </div>
        </section>
      </div>
    </div>
  );
}
