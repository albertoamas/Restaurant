import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/auth.context';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import toast from 'react-hot-toast';

export function LoginPage() {
  const { login, register, isAuthenticated } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    email: '',
    password: '',
    businessName: '',
    ownerName: '',
  });

  if (isAuthenticated) {
    window.location.href = '/pos';
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isRegister) {
        await register({
          businessName: form.businessName,
          ownerName: form.ownerName,
          email: form.email,
          password: form.password,
        });
        toast.success('Negocio registrado exitosamente');
      } else {
        await login(form.email, form.password);
        toast.success('Bienvenido');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-sky-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">POS System</h1>
          <p className="text-gray-500 mt-1">Sistema de Punto de Venta</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">
            {isRegister ? 'Crear Cuenta' : 'Iniciar Sesión'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegister && (
              <>
                <Input
                  label="Nombre del Negocio"
                  placeholder="Ej: Pollos Don Pepe"
                  value={form.businessName}
                  onChange={set('businessName')}
                  required
                />
                <Input
                  label="Tu Nombre"
                  placeholder="Ej: Juan Pérez"
                  value={form.ownerName}
                  onChange={set('ownerName')}
                  required
                />
              </>
            )}
            <Input
              label="Correo Electrónico"
              type="email"
              placeholder="correo@ejemplo.com"
              value={form.email}
              onChange={set('email')}
              required
            />
            <Input
              label="Contraseña"
              type="password"
              placeholder="Mínimo 6 caracteres"
              value={form.password}
              onChange={set('password')}
              required
              minLength={6}
            />
            <Button type="submit" fullWidth size="lg" loading={loading}>
              {isRegister ? 'Registrar Negocio' : 'Entrar'}
            </Button>
          </form>

          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={() => setIsRegister(!isRegister)}
              className="text-sm text-sky-600 hover:text-sky-700 font-medium"
            >
              {isRegister ? '¿Ya tienes cuenta? Inicia sesión' : '¿Nuevo? Registra tu negocio'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
