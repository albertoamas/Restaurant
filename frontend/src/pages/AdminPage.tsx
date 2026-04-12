import { useState, useEffect, useCallback } from 'react';
import { SaasPlan } from '@pos/shared';
import { adminApi, type TenantRow, type TenantModules, type PlanRow, type CreateTenantPayload } from '../api/admin.api';
import { Button } from '../components/ui/Button';
import { Spinner } from '../components/ui/Spinner';
import { AdminLogin } from '../components/admin/AdminLogin';
import { PlansSection } from '../components/admin/PlansSection';
import { TenantPanel } from '../components/admin/TenantPanel';
import { TenantAvatar } from '../components/admin/TenantAvatar';
import { PlanBadge } from '../components/admin/PlanBadge';

function formatTenantDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-BO', { day: '2-digit', month: 'short', year: 'numeric' });
}

const EMPTY_FORM: CreateTenantPayload = { businessName: '', ownerName: '', email: '', password: '' };

const CREATE_FIELDS: [keyof CreateTenantPayload, string, string, string][] = [
  ['businessName', 'Nombre del negocio',  'text',     'Ej: HamBurgos'],
  ['ownerName',    'Nombre del dueño',    'text',     'Ej: Juan Pérez'],
  ['email',        'Email del dueño',     'email',    'correo@ejemplo.com'],
  ['password',     'Contraseña inicial',  'text',     'Mínimo 6 caracteres'],
];

export function AdminPage() {
  const [authenticated, setAuthenticated] = useState(adminApi.hasKey());
  const [keyInput, setKeyInput] = useState('');
  const [keyError, setKeyError] = useState('');
  const [tenants, setTenants] = useState<TenantRow[]>([]);
  const [plans, setPlans] = useState<PlanRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [toggling, setToggling] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');
  const [form, setForm] = useState<CreateTenantPayload>(EMPTY_FORM);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [t, p] = await Promise.all([adminApi.getTenants(), adminApi.getPlans()]);
      setTenants(t);
      setPlans(p);
    } catch {
      setAuthenticated(false);
      adminApi.clearKey();
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { if (authenticated) loadData(); }, [authenticated, loadData]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setKeyError('');
    adminApi.saveKey(keyInput);
    try {
      const [t, p] = await Promise.all([adminApi.getTenants(), adminApi.getPlans()]);
      setTenants(t);
      setPlans(p);
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
      setTenants((prev) => prev.map((t) => t.id === id ? { ...t, isActive: updated.isActive } : t));
    } finally {
      setToggling(null);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setCreateError('');
    try {
      await adminApi.createTenant(form);
      setForm(EMPTY_FORM);
      setShowForm(false);
      await loadData();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setCreateError(typeof msg === 'string' ? msg : 'Error al crear el negocio');
    } finally {
      setCreating(false);
    }
  };

  const handleLogout = () => {
    adminApi.clearKey();
    setAuthenticated(false);
    setTenants([]);
    setKeyInput('');
  };

  const setField = (field: keyof CreateTenantPayload) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const updateTenantPlan = (id: string, plan: SaasPlan) =>
    setTenants((prev) => prev.map((t) => t.id === id ? { ...t, plan } : t));

  const updateTenantModules = (id: string, modules: TenantModules) =>
    setTenants((prev) => prev.map((t) => t.id === id ? { ...t, modules } : t));

  const updatePlanRow = (updated: PlanRow) =>
    setPlans((prev) => prev.map((p) => p.id === updated.id ? updated : p));

  const activeCount = tenants.filter((t) => t.isActive).length;
  const inactiveCount = tenants.filter((t) => !t.isActive).length;

  if (!authenticated) {
    return (
      <AdminLogin
        keyInput={keyInput}
        keyError={keyError}
        onKeyChange={setKeyInput}
        onSubmit={handleLogin}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[linear-gradient(165deg,oklch(0.975_0.006_250),oklch(0.955_0.012_248))]">

      {/* Top bar */}
      <header className="bg-[oklch(0.145_0.020_255)] border-b border-white/8 sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center gap-3">
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="w-7 h-7 rounded-lg bg-primary-500/20 border border-primary-400/25 flex items-center justify-center">
              <svg className="w-3.5 h-3.5 text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18" />
              </svg>
            </div>
            <span className="font-heading font-bold text-sm text-white">Admin Console</span>
          </div>

          <div className="w-px h-4 bg-white/12 shrink-0" />

          <div className="flex items-center gap-3 text-xs">
            <span className="text-white/40 hidden sm:block">{tenants.length} negocios</span>
            <span className="flex items-center gap-1.5 text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse-dot" />
              {activeCount} activos
            </span>
            {inactiveCount > 0 && (
              <span className="text-red-400/80">{inactiveCount} inactivos</span>
            )}
          </div>

          <div className="flex-1" />

          <div className="flex items-center gap-2">
            <button
              onClick={() => { setShowForm((v) => !v); setCreateError(''); }}
              className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${showForm ? 'bg-white/10 text-white/60 hover:bg-white/15' : 'bg-primary-600 hover:bg-primary-500 text-white shadow-sm'}`}
            >
              {showForm ? '✕ Cancelar' : '+ Nuevo negocio'}
            </button>
            <button
              onClick={handleLogout}
              className="text-xs text-white/30 hover:text-white/60 transition-colors px-2 py-1.5 rounded-lg hover:bg-white/8"
            >
              Salir
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6">

        {/* Create tenant form */}
        {showForm && (
          <div className="bg-white/90 rounded-2xl p-5 mb-6 shadow-[0_8px_24px_oklch(0.13_0.012_260/0.10)] border border-white/70 backdrop-blur-sm animate-slide">
            <h2 className="font-heading font-bold text-sm text-gray-900 mb-4">Nuevo negocio</h2>
            <form onSubmit={handleCreate} className="grid grid-cols-2 gap-3">
              {CREATE_FIELDS.map(([field, label, type, placeholder]) => (
                <div key={field} className="col-span-2 sm:col-span-1">
                  <label className="block text-xs font-medium text-gray-500 mb-1">{label}</label>
                  <input
                    type={type} value={form[field]} onChange={setField(field)}
                    placeholder={placeholder} required minLength={field === 'password' ? 6 : undefined}
                    className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-primary-400/40"
                  />
                </div>
              ))}
              {createError && <p className="col-span-2 text-xs text-red-500">{createError}</p>}
              <div className="col-span-2 flex justify-end">
                <Button type="submit" variant="primary" size="sm" loading={creating}>Crear negocio</Button>
              </div>
            </form>
          </div>
        )}

        {/* Plans editor */}
        {plans.length > 0 && (
          <PlansSection plans={plans} onUpdate={updatePlanRow} />
        )}

        {/* Tenant list */}
        <section>
          <div className="px-1 mb-3">
            <h2 className="font-heading font-bold text-sm text-gray-900">Negocios</h2>
            <p className="text-xs text-gray-400 mt-0.5">Gestión de tenants, planes y módulos</p>
          </div>

          <div className="bg-white/90 rounded-2xl shadow-[0_8px_24px_oklch(0.13_0.012_260/0.10)] border border-white/70 overflow-hidden backdrop-blur-sm">
            {loading ? (
              <div className="flex justify-center py-12"><Spinner /></div>
            ) : tenants.length === 0 ? (
              <div className="flex flex-col items-center py-14 text-center">
                <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center mb-3">
                  <svg className="w-5 h-5 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <p className="text-sm text-gray-400">No hay negocios registrados</p>
                <p className="text-xs text-gray-300 mt-1">Crea el primero con el botón de arriba</p>
              </div>
            ) : (
              <div>
                {tenants.map((t, idx) => (
                  <div key={t.id} className={idx !== 0 ? 'border-t border-gray-100' : ''}>
                    <div className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50/50 transition-colors">
                      <button
                        onClick={() => setExpandedId((prev) => prev === t.id ? null : t.id)}
                        className="p-1 rounded-lg text-gray-300 hover:text-gray-500 hover:bg-gray-100 transition-colors shrink-0"
                        aria-expanded={expandedId === t.id}
                      >
                        <svg className={`w-4 h-4 transition-transform duration-200 ${expandedId === t.id ? 'rotate-90' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>

                      <TenantAvatar name={t.name} />

                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm text-gray-900 truncate">{t.name}</p>
                        <p className="text-xs text-gray-400 truncate">{t.slug}</p>
                      </div>

                      <div className="hidden sm:block w-36 shrink-0">
                        {t.owner ? (
                          <>
                            <p className="text-xs font-medium text-gray-700 truncate">{t.owner.name}</p>
                            <p className="text-xs text-gray-400 truncate">{t.owner.email}</p>
                          </>
                        ) : (
                          <span className="text-gray-300 text-xs">—</span>
                        )}
                      </div>

                      <div className="hidden md:block w-20 shrink-0 text-xs text-gray-400 text-right">
                        {formatTenantDate(t.createdAt)}
                      </div>

                      <div className="shrink-0">
                        <PlanBadge plan={t.plan} />
                      </div>

                      <div className="shrink-0 hidden sm:block">
                        <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${t.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-500'}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${t.isActive ? 'bg-green-500' : 'bg-red-400'}`} />
                          {t.isActive ? 'Activo' : 'Inactivo'}
                        </span>
                      </div>

                      <button
                        onClick={() => handleToggle(t.id)}
                        disabled={toggling === t.id}
                        className={`shrink-0 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50 ${t.isActive ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-green-50 text-green-700 hover:bg-green-100'}`}
                      >
                        {toggling === t.id ? '…' : t.isActive ? 'Desactivar' : 'Activar'}
                      </button>
                    </div>

                    {expandedId === t.id && (
                      <TenantPanel
                        tenant={t}
                        plans={plans}
                        onPlanUpdate={updateTenantPlan}
                        onModulesUpdate={updateTenantModules}
                      />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
