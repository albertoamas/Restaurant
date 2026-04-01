import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/auth.context';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import toast from 'react-hot-toast';
import { handleApiError } from '../utils/api-error';

export function LoginPage() {
  const { login, isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(false);
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
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Atmospheric blobs */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full blur-3xl pointer-events-none"
        style={{ background: 'oklch(0.70 0.18 225 / 0.08)' }} />
      <div className="absolute bottom-0 right-0 w-80 h-80 rounded-full blur-3xl pointer-events-none"
        style={{ background: 'oklch(0.55 0.18 145 / 0.07)' }} />
      <div className="absolute bottom-1/4 left-0 w-72 h-72 rounded-full blur-3xl pointer-events-none"
        style={{ background: 'oklch(0.65 0.20 290 / 0.06)' }} />

      <div className="w-full max-w-sm relative z-10">
        {/* Logo + brand */}
        <div className="text-center mb-8 animate-slide stagger-1">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-[0_6px_20px_oklch(0.50_0.24_225/0.40)]"
            style={{ background: 'linear-gradient(135deg, oklch(0.60 0.22 225), oklch(0.44 0.22 225))' }}>
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
            </svg>
          </div>
          <h1 className="font-heading font-black text-4xl text-gray-900 tracking-tight">POS System</h1>
          <p className="text-sm text-gray-500 mt-1.5">Sistema POS para restaurantes</p>
        </div>

        {/* Form card */}
        <div
          className="bg-white rounded-2xl p-8 animate-slide stagger-2"
          style={{
            boxShadow: '0 4px 24px oklch(0.13 0.012 260 / 0.10), 0 1px 4px oklch(0.13 0.012 260 / 0.06)',
          }}
        >
          <h2 className="text-base font-bold text-gray-900 mb-5 font-heading">Iniciar Sesión</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Correo Electrónico"
              type="email"
              placeholder="correo@ejemplo.com"
              value={form.email}
              onChange={set('email')}
              inputSize="lg"
              required
            />
            <Input
              label="Contraseña"
              type="password"
              placeholder="••••••••"
              value={form.password}
              onChange={set('password')}
              inputSize="lg"
              required
            />
            <Button type="submit" fullWidth size="lg" loading={loading}>
              Entrar
            </Button>
          </form>

        </div>
      </div>
    </div>
  );
}
