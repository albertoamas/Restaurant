import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/auth.context';
import { Icon } from '../components/ui/Icon';
import toast from 'react-hot-toast';
import { getApiErrorMessage } from '../utils/api-error';

const BG   = 'oklch(0.10  0.012 38)';
const BG2  = 'oklch(0.145 0.016 40)';
const BD   = 'oklch(0.24  0.016 40)';
const ORG  = 'oklch(0.65  0.22  42)';
const ORG2 = 'oklch(0.60  0.22  40)';
const ORGG = 'oklch(0.65  0.22  42 / 0.18)';
const CR   = 'oklch(0.93  0.010 52)';
const CR2  = 'oklch(0.68  0.012 50)';
const CR3  = 'oklch(0.42  0.008 48)';

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
    <div
      className="min-h-svh relative overflow-hidden flex items-center justify-center p-4 sm:p-6 lg:p-8"
      style={{ background: BG }}
    >
      {/* Aurora orbs */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: [
            `radial-gradient(ellipse 70% 55% at 8% 0%,   ${ORGG} 0%, transparent 60%)`,
            `radial-gradient(ellipse 50% 40% at 92% 8%,  oklch(0.50 0.18 38 / 0.10) 0%, transparent 55%)`,
            `radial-gradient(ellipse 60% 45% at 50% 100%, oklch(0.48 0.16 48 / 0.07) 0%, transparent 60%)`,
          ].join(','),
        }}
      />

      <div
        className="relative z-10 w-full max-w-[430px] lg:max-w-5xl rounded-3xl overflow-hidden lg:grid lg:grid-cols-[1.1fr_0.9fr]"
        style={{
          border: `1px solid ${BD}`,
          boxShadow: '0 32px 80px oklch(0.04 0.008 38 / 0.9)',
        }}
      >
        {/* LEFT — brand panel */}
        <section
          className="hidden lg:flex flex-col justify-between p-10 xl:p-12 relative overflow-hidden border-r"
          style={{
            background: `linear-gradient(165deg, oklch(0.16 0.028 40) 0%, oklch(0.10 0.014 38) 100%)`,
            borderColor: BD,
          }}
        >
          {/* Decorative orb */}
          <div
            className="absolute -top-24 -right-24 w-80 h-80 rounded-full opacity-20 blur-3xl pointer-events-none"
            style={{ background: ORG }}
          />
          <div
            className="absolute -bottom-20 -left-14 w-72 h-72 rounded-full opacity-10 pointer-events-none"
            style={{ background: ORG }}
          />

          <div className="relative animate-slide stagger-1">
            <h1
              className="font-heading font-black text-5xl leading-[1.02] tracking-tight"
              style={{ color: CR }}
            >
              Yanko<span style={{ color: CR3 }}>POS</span>
            </h1>
            <p className="mt-3 text-sm" style={{ color: CR2 }}>
              {BRAND_TAGLINE}
            </p>

            <p
              className="mt-8 text-xs uppercase tracking-[0.16em] font-semibold"
              style={{ color: CR3 }}
            >
              Panel Operativo
            </p>
            <h2
              className="mt-2 text-3xl font-heading font-black leading-tight"
              style={{ color: CR }}
            >
              Tu restaurante, en ritmo de servicio.
            </h2>
          </div>

          <div className="relative grid grid-cols-3 gap-3 text-xs animate-slide stagger-2">
            {[
              { label: 'Pedidos', value: 'Continuos' },
              { label: 'Caja', value: 'Controlada' },
              { label: 'Cocina', value: 'Sin fricción' },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-xl px-3 py-3"
                style={{ border: `1px solid ${BD}`, background: 'oklch(0.18 0.022 40)' }}
              >
                <p style={{ color: CR3 }}>{item.label}</p>
                <p className="font-bold text-base mt-1" style={{ color: CR }}>{item.value}</p>
              </div>
            ))}
          </div>
        </section>

        {/* RIGHT — form panel */}
        <section
          className="p-6 sm:p-8 lg:p-10 flex flex-col justify-center"
          style={{ background: BG2 }}
        >
          {/* Mobile brand */}
          <div className="lg:hidden mb-6">
            <div className="flex items-center gap-3 mb-2.5">
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center shadow-[0_8px_18px_oklch(0.60_0.22_42/0.35)]"
                style={{ background: ORG2 }}
              >
                <Icon name="cart" size={20} strokeWidth={2} className="text-white" />
              </div>
              <div>
                <h1 className="font-heading font-black text-2xl tracking-tight" style={{ color: CR }}>
                  YankoPOS
                </h1>
                <p className="text-[11px] leading-snug max-w-[22rem]" style={{ color: CR3 }}>
                  {BRAND_TAGLINE}
                </p>
              </div>
            </div>
          </div>

          <div className="max-w-sm mx-auto lg:mx-0 w-full">
            <p
              className="text-xs uppercase tracking-[0.17em] font-semibold mb-2"
              style={{ color: ORG }}
            >
              Acceso Seguro
            </p>
            <h2 className="text-3xl font-heading font-black tracking-tight" style={{ color: CR }}>
              Bienvenido
            </h2>
            <p className="text-sm mt-1 mb-6" style={{ color: CR2 }}>
              Ingresa tus credenciales para continuar.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email */}
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium" style={{ color: CR2 }}>
                  Correo electrónico
                </label>
                <div
                  className="flex items-center rounded-xl border transition-[border-color,box-shadow] duration-150 focus-within:ring-[3px]"
                  style={{
                    background: 'oklch(0.11 0.014 38)',
                    borderColor: BD,
                  }}
                  onFocus={() => {}}
                >
                  <input
                    type="email"
                    name="email"
                    autoComplete="email"
                    placeholder="correo@tu-negocio.bo"
                    value={form.email}
                    onChange={set('email')}
                    required
                    className="flex-1 min-w-0 bg-transparent outline-none px-4 py-3 text-base placeholder:text-gray-400"
                    style={{ color: CR }}
                  />
                </div>
              </div>

              {/* Password */}
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium" style={{ color: CR2 }}>
                  Contraseña
                </label>
                <div
                  className="flex items-center rounded-xl border transition-[border-color,box-shadow] duration-150"
                  style={{
                    background: 'oklch(0.11 0.014 38)',
                    borderColor: BD,
                  }}
                >
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    autoComplete="current-password"
                    placeholder="••••••••"
                    value={form.password}
                    onChange={set('password')}
                    required
                    className="flex-1 min-w-0 bg-transparent outline-none px-4 py-3 text-base placeholder:text-gray-400"
                    style={{ color: CR }}
                  />
                  <button
                    type="button"
                    aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="-mr-1 p-2 rounded-lg transition-colors mr-2"
                    style={{ color: CR3 }}
                  >
                    <Icon name={showPassword ? 'eye-off' : 'eye'} size={20} strokeWidth={2} />
                  </button>
                </div>
              </div>

              {/* Recuérdame */}
              <label className="flex items-center gap-2.5 cursor-pointer select-none mt-1">
                <input
                  type="checkbox"
                  id="remember"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="sr-only"
                />
                <div
                  aria-hidden="true"
                  className={`w-4 h-4 rounded flex items-center justify-center border transition-all duration-150 shrink-0 ${
                    remember
                      ? 'bg-primary-600 border-primary-600'
                      : 'bg-white/5 border-white/20 hover:border-white/40'
                  }`}
                >
                  {remember && <Icon name="check" size={10} strokeWidth={3} className="text-white" />}
                </div>
                <span className="text-sm" style={{ color: CR2 }}>Recordar sesión</span>
              </label>

              {/* Error inline */}
              {errorMsg && (
                <div className="flex items-start gap-2.5 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2.5 text-sm text-red-400">
                  <Icon name="warning" size={16} strokeWidth={2} className="shrink-0 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl text-base font-bold text-white transition-all duration-150 mt-2 disabled:opacity-60"
                style={{
                  background: loading ? ORG2 : `linear-gradient(135deg, ${ORG} 0%, ${ORG2} 100%)`,
                  boxShadow: `0 4px_16px oklch(0.60 0.22 42 / 0.40)`,
                }}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Entrando...
                  </span>
                ) : (
                  'Entrar al panel'
                )}
              </button>
            </form>
          </div>
        </section>
      </div>
    </div>
  );
}
