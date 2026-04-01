import { useState, useEffect, useCallback } from 'react';
import { adminApi, type TenantRow, type CreateTenantPayload } from '../api/admin.api';
import { Button } from '../components/ui/Button';
import { Spinner } from '../components/ui/Spinner';

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-BO', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function AdminPage() {
  const [authenticated, setAuthenticated] = useState(adminApi.hasKey());
  const [keyInput, setKeyInput] = useState('');
  const [keyError, setKeyError] = useState('');
  const [tenants, setTenants] = useState<TenantRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [toggling, setToggling] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');
  const emptyForm: CreateTenantPayload = { businessName: '', ownerName: '', email: '', password: '' };
  const [form, setForm] = useState<CreateTenantPayload>(emptyForm);

  const loadTenants = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminApi.getTenants();
      setTenants(data);
    } catch {
      setAuthenticated(false);
      adminApi.clearKey();
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authenticated) loadTenants();
  }, [authenticated, loadTenants]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setKeyError('');
    adminApi.saveKey(keyInput);
    try {
      const data = await adminApi.getTenants();
      setTenants(data);
      setAuthenticated(true);
    } catch {
      adminApi.clearKey();
      setKeyError('Clave incorrecta');
    }
  };

  const handleToggle = async (id: string) => {
    setToggling(id);
    try {
      const updated = await adminApi.toggleTenant(id);
      setTenants((prev) =>
        prev.map((t) => (t.id === id ? { ...t, isActive: updated.isActive } : t)),
      );
    } finally {
      setToggling(null);
    }
  };

  const handleLogout = () => {
    adminApi.clearKey();
    setAuthenticated(false);
    setTenants([]);
    setKeyInput('');
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setCreateError('');
    try {
      await adminApi.createTenant(form);
      setForm(emptyForm);
      setShowForm(false);
      await loadTenants();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setCreateError(typeof msg === 'string' ? msg : 'Error al crear el negocio');
    } finally {
      setCreating(false);
    }
  };

  const setField = (field: keyof CreateTenantPayload) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  if (!authenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
        <div className="w-full max-w-xs bg-white rounded-2xl p-8 shadow-[0_4px_24px_oklch(0.13_0.012_260/0.10)]">
          <div className="w-12 h-12 rounded-xl bg-gray-900 flex items-center justify-center mx-auto mb-5">
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h1 className="font-heading font-black text-xl text-gray-900 text-center mb-1">Admin</h1>
          <p className="text-xs text-gray-400 text-center mb-6">Panel de administración</p>
          <form onSubmit={handleLogin} className="space-y-3">
            <input
              type="password"
              value={keyInput}
              onChange={(e) => setKeyInput(e.target.value)}
              placeholder="Clave de administrador"
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-gray-400"
              autoFocus
            />
            {keyError && <p className="text-xs text-red-500">{keyError}</p>}
            <Button type="submit" variant="primary" fullWidth>
              Entrar
            </Button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-heading font-black text-2xl text-gray-900">Panel de Admin</h1>
            <p className="text-sm text-gray-400 mt-0.5">{tenants.length} negocio{tenants.length !== 1 ? 's' : ''} registrado{tenants.length !== 1 ? 's' : ''}</p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              size="sm"
              variant="primary"
              onClick={() => { setShowForm((v) => !v); setCreateError(''); }}
            >
              {showForm ? 'Cancelar' : '+ Nuevo negocio'}
            </Button>
            <button
              onClick={handleLogout}
              className="text-xs text-gray-400 hover:text-gray-600 underline"
            >
              Salir
            </button>
          </div>
        </div>

        {/* Create tenant form */}
        {showForm && (
          <div className="bg-white rounded-2xl p-6 mb-6 shadow-sm border border-gray-100">
            <h2 className="font-heading font-bold text-base text-gray-900 mb-4">Nuevo negocio</h2>
            <form onSubmit={handleCreate} className="grid grid-cols-2 gap-3">
              <div className="col-span-2 sm:col-span-1">
                <label className="block text-xs font-medium text-gray-500 mb-1">Nombre del negocio</label>
                <input
                  type="text"
                  value={form.businessName}
                  onChange={setField('businessName')}
                  placeholder="Ej: HamBurgos"
                  required
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-400"
                />
              </div>
              <div className="col-span-2 sm:col-span-1">
                <label className="block text-xs font-medium text-gray-500 mb-1">Nombre del dueño</label>
                <input
                  type="text"
                  value={form.ownerName}
                  onChange={setField('ownerName')}
                  placeholder="Ej: Juan Pérez"
                  required
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-400"
                />
              </div>
              <div className="col-span-2 sm:col-span-1">
                <label className="block text-xs font-medium text-gray-500 mb-1">Email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={setField('email')}
                  placeholder="correo@ejemplo.com"
                  required
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-400"
                />
              </div>
              <div className="col-span-2 sm:col-span-1">
                <label className="block text-xs font-medium text-gray-500 mb-1">Contraseña inicial</label>
                <input
                  type="text"
                  value={form.password}
                  onChange={setField('password')}
                  placeholder="Mínimo 6 caracteres"
                  required
                  minLength={6}
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-400"
                />
              </div>
              {createError && (
                <p className="col-span-2 text-xs text-red-500">{createError}</p>
              )}
              <div className="col-span-2 flex justify-end">
                <Button type="submit" variant="primary" size="sm" loading={creating}>
                  Crear negocio
                </Button>
              </div>
            </form>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { label: 'Total', value: tenants.length, color: 'text-gray-900' },
            { label: 'Activos', value: tenants.filter((t) => t.isActive).length, color: 'text-green-600' },
            { label: 'Inactivos', value: tenants.filter((t) => !t.isActive).length, color: 'text-red-500' },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 text-center">
              <p className={`font-heading font-black text-2xl ${s.color}`}>{s.value}</p>
              <p className="text-xs text-gray-400 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {loading ? (
            <div className="flex justify-center py-12">
              <Spinner />
            </div>
          ) : tenants.length === 0 ? (
            <p className="text-center text-sm text-gray-400 py-12">No hay negocios registrados</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide">
                  <th className="px-4 py-3">Negocio</th>
                  <th className="px-4 py-3">Dueño</th>
                  <th className="px-4 py-3">Registro</th>
                  <th className="px-4 py-3">Estado</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {tenants.map((t) => (
                  <tr key={t.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-semibold text-gray-900">{t.name}</p>
                      <p className="text-xs text-gray-400">{t.slug}</p>
                    </td>
                    <td className="px-4 py-3">
                      {t.owner ? (
                        <>
                          <p className="text-gray-700">{t.owner.name}</p>
                          <p className="text-xs text-gray-400">{t.owner.email}</p>
                        </>
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-500">{formatDate(t.createdAt)}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${
                        t.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-500'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${t.isActive ? 'bg-green-500' : 'bg-red-400'}`} />
                        {t.isActive ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleToggle(t.id)}
                        disabled={toggling === t.id}
                        className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50 ${
                          t.isActive
                            ? 'bg-red-50 text-red-600 hover:bg-red-100'
                            : 'bg-green-50 text-green-700 hover:bg-green-100'
                        }`}
                      >
                        {toggling === t.id ? '...' : t.isActive ? 'Desactivar' : 'Activar'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
