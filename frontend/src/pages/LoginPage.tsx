import { useState } from 'react';
import { Navigate, Link } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuth } from '../context/auth.context';
import { Button } from '../components/ui/Button';
import { Icon } from '../components/ui/Icon';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { PasswordInput } from '../components/ui/PasswordInput';
import { getApiErrorMessage } from '../utils/api-error';
import { isStandalone } from '../utils/pwa-install';

function Brand({ subtitle }: { subtitle?: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-control bg-primary-600 text-white shadow-raised">
        <Icon name="cart" size={22} strokeWidth={2} />
      </span>
      <div>
        <p className="font-heading text-title font-bold leading-none text-main">
          Yanko<span className="text-primary-600 dark:text-primary-400">POS</span>
        </p>
        {subtitle && <p className="mt-1 text-caption text-muted">{subtitle}</p>}
      </div>
    </div>
  );
}

/** Casilla accesible del kit visual: input nativo (teclado y lector) con la tilde dibujada encima. */
function Checkbox({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="inline-flex min-h-11 cursor-pointer items-center gap-2.5 select-none">
      <span className="relative flex h-5 w-5 shrink-0">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="peer h-5 w-5 cursor-pointer appearance-none rounded-md border-2 border-line-strong bg-surface-card transition-colors checked:border-primary-600 checked:bg-primary-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/60 focus-visible:ring-offset-2 focus-visible:ring-offset-surface-card"
        />
        <Icon name="check" size={14} strokeWidth={3} className="pointer-events-none absolute inset-0 m-auto text-white opacity-0 peer-checked:opacity-100" />
      </span>
      <span className="text-label font-medium text-soft">{label}</span>
    </label>
  );
}

export function LoginPage() {
  const { login, isAuthenticated } = useAuth();
  const [loading, setLoading]   = useState(false);
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [forgotOpen, setForgotOpen] = useState(false);
  // En la app instalada no hay landing a la que volver: es la herramienta de trabajo.
  const [installed] = useState(() => isStandalone(window));

  if (isAuthenticated) return <Navigate to="/pos" replace />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);
    try {
      await login(email.trim(), password, remember);
      toast.success('Sesión iniciada');
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const status = err.response?.status;
        if (status === 401)      setErrorMsg('Correo o contraseña incorrectos.');
        else if (status === 429) setErrorMsg('Demasiados intentos fallidos. Espera un momento e intenta de nuevo.');
        else                     setErrorMsg(getApiErrorMessage(err, 'No se pudo conectar con el servidor. Revisa tu conexión.'));
      } else {
        setErrorMsg('Error inesperado. Intenta de nuevo.');
      }
    } finally {
      setLoading(false);
    }
  };

  const clearError = () => setErrorMsg(null);

  return (
    <div className="relative flex min-h-dvh flex-col bg-surface-page">
      {/* Brillo de la marca, muy suave: decora sin competir con el formulario. */}
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -right-40 -top-40 h-[560px] w-[560px] rounded-full bg-primary-500/10 blur-[110px]" />
        <div className="absolute -bottom-48 -left-40 h-[480px] w-[480px] rounded-full bg-primary-500/5 blur-[100px]" />
      </div>

      {!installed && (
        <div className="relative z-10 px-4 pt-4 sm:px-6 sm:pt-6">
          <Link
            to="/"
            className="inline-flex min-h-11 items-center gap-2 rounded-control px-2 text-label font-medium text-soft transition-colors hover:text-main focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/60"
          >
            <Icon name="arrow-left" size={16} />
            Volver al inicio
          </Link>
        </div>
      )}

      <main className="relative z-10 flex flex-1 items-center justify-center px-4 py-8 sm:px-6">
        <div className="w-full max-w-[920px] overflow-hidden rounded-dialog border border-line bg-surface-card shadow-overlay lg:grid lg:grid-cols-[1fr_minmax(0,440px)] animate-fade">
          {/* Escritorio: marca y una frase. Sin publicidad: quien llega aquí ya es cliente. */}
          <section className="relative hidden flex-col justify-between overflow-hidden border-r border-line bg-surface-2 p-10 lg:flex">
            <div aria-hidden className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-primary-500/15 blur-[80px]" />
            <div className="relative">
              <Brand />
            </div>
            <div className="relative">
              <p className="font-heading text-[30px] font-bold leading-tight text-main">
                Ventas, caja y cocina de tu negocio en un solo lugar.
              </p>
              <p className="mt-3 text-body text-soft">Desde la caja, la tablet o el celular.</p>
            </div>
          </section>

          <section className="p-6 sm:p-10">
            <div className="lg:hidden mb-8">
              <Brand subtitle="Ventas, caja y cocina" />
            </div>

            <h1 className="font-heading text-title font-bold text-main">Inicia sesión</h1>
            <p className="mt-1 text-body text-soft">Con el correo y la contraseña que te dio tu negocio.</p>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <Input
                label="Correo"
                type="email"
                name="email"
                autoComplete="email"
                inputMode="email"
                placeholder="correo@ejemplo.com"
                value={email}
                onChange={(e) => { setEmail(e.target.value); clearError(); }}
                required
              />
              <PasswordInput
                label="Contraseña"
                autoComplete="current-password"
                value={password}
                onChange={(v) => { setPassword(v); clearError(); }}
              />

              <Checkbox checked={remember} onChange={setRemember} label="Recordar sesión en este equipo" />

              {errorMsg && (
                <p role="alert" className="flex items-start gap-2 rounded-control border border-red-500/30 bg-red-500/10 px-3 py-2.5 text-label font-medium text-red-700 dark:text-red-400 animate-in">
                  <Icon name="warning" size={16} className="mt-0.5 shrink-0" />
                  {errorMsg}
                </p>
              )}

              <Button type="submit" size="lg" fullWidth loading={loading} disabled={!email.trim() || !password}>
                Entrar
              </Button>
            </form>

            <div className="mt-3 flex justify-center">
              <Button type="button" variant="ghost" size="sm" onClick={() => setForgotOpen(true)}>
                ¿Olvidaste tu contraseña?
              </Button>
            </div>
          </section>
        </div>
      </main>

      <Modal
        isOpen={forgotOpen}
        onClose={() => setForgotOpen(false)}
        title="¿Olvidaste tu contraseña?"
        size="sm"
        footer={<Button fullWidth onClick={() => setForgotOpen(false)}>Entendido</Button>}
      >
        <div className="space-y-3 text-body text-soft">
          <p>
            <span className="font-semibold text-main">Si eres cajero:</span> pídele al dueño de tu negocio que te
            ponga una nueva desde Equipo.
          </p>
          <p>
            <span className="font-semibold text-main">Si eres el dueño:</span> escribe a soporte de YankoPOS y te
            ayudamos a recuperar el acceso.
          </p>
        </div>
      </Modal>
    </div>
  );
}
