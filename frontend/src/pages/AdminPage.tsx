import { useState, useEffect, useCallback } from 'react';
import { SaasPlan } from '@pos/shared';
import { adminApi, type TenantRow, type TenantModules, type PlanDto, type CreateTenantPayload } from '../api/admin.api';
import { Button } from '../components/ui/Button';
import { Icon } from '../components/ui/Icon';
import { Spinner } from '../components/ui/Spinner';
import { AdminLogin } from '../components/admin/AdminLogin';
import { PlansSection } from '../components/admin/PlansSection';
import { TenantPanel } from '../components/admin/TenantPanel';
import { TenantAvatar } from '../components/admin/TenantAvatar';
import { PlanBadge } from '../components/admin/PlanBadge';
import { useTheme } from '../hooks/useTheme';

function formatTenantDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-BO', { day: '2-digit', month: 'short', year: 'numeric' });
}

const EMPTY_FORM: CreateTenantPayload = { businessName: '', ownerName: '', email: '', password: '', branchName: '' };

/**
 * `required` y `minLength` replican lo que valida RegisterDto en el backend: si
 * no coinciden, el navegador deja pasar un valor que el servidor rechaza con un
 * mensaje de class-validator en inglés dentro de una UI en español.
 */
type CreateField = {
  field: keyof CreateTenantPayload;
  label: string;
  type: string;
  placeholder: string;
  required: boolean;
  minLength?: number;
};

const CREATE_FIELDS: CreateField[] = [
  { field: 'businessName', label: 'Nombre del negocio', type: 'text',  placeholder: 'Ej: HamBurgos',                    required: true,  minLength: 2 },
  { field: 'ownerName',    label: 'Nombre del dueño',   type: 'text',  placeholder: 'Ej: Juan Pérez',                   required: true,  minLength: 2 },
  { field: 'email',        label: 'Email del dueño',    type: 'email', placeholder: 'correo@ejemplo.com',               required: true },
  { field: 'password',     label: 'Contraseña inicial', type: 'text',  placeholder: 'Mínimo 6 caracteres',              required: true,  minLength: 6 },
  { field: 'branchName',   label: 'Primera sucursal',   type: 'text',  placeholder: 'Principal (si lo dejas vacío)',    required: false, minLength: 2 },
];

export function AdminPage() {
  const { theme, toggle: toggleTheme } = useTheme();
  const [authenticated, setAuthenticated] = useState(adminApi.hasKey());
  const [keyInput, setKeyInput] = useState('');
  const [keyError, setKeyError] = useState('');
  const [tenants, setTenants] = useState<TenantRow[]>([]);
  const [plans, setPlans] = useState<PlanDto[]>([]);
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

  const updatePlanDto = (updated: PlanDto) =>
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
    <div className="min-h-screen bg-[var(--color-surface-page)]">

      {/* Top bar */}
      <header
        data-print-hide
        className="sticky top-0 z-20 border-b border-[var(--border-subtle)] bg-[var(--color-surface-page)]/85 backdrop-blur-xl transition-colors"
      >
        <div className="mx-auto flex h-16 max-w-5xl items-center gap-4 px-4 sm:px-6">
          <div className="flex shrink-0 items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-primary-500/20 bg-primary-500/10">
              <Icon name="lock" size={14} strokeWidth={2} className="text-primary-500" />
            </div>
            <div className="leading-tight">
              <p className="font-heading text-sm font-bold text-[var(--color-text-main)]">Admin Console</p>
              <p className="hidden font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--color-text-muted)] sm:block">YankoPOS</p>
            </div>
          </div>

          <div className="h-6 w-px shrink-0 bg-[var(--border-subtle)]" />

          <div className="flex items-center gap-2 text-xs">
            <span className="hidden text-[var(--color-text-muted)] sm:inline">{tenants.length} negocios</span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 font-medium text-emerald-500">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse-dot" />
              {activeCount} activos
            </span>
            {inactiveCount > 0 && (
              <span className="inline-flex items-center rounded-full border border-red-500/20 bg-red-500/10 px-2.5 py-1 font-medium text-red-500">
                {inactiveCount} inactivos
              </span>
            )}
          </div>

          <div className="flex-1" />

          <div className="flex items-center gap-1.5">
            <button
              onClick={toggleTheme}
              title={theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}
              className="rounded-lg p-2 text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text-main)]"
            >
              <Icon name={theme === 'dark' ? 'sun' : 'moon'} size={15} strokeWidth={1.75} />
            </button>
            <button
              onClick={() => { setShowForm((v) => !v); setCreateError(''); }}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition-colors ${
                showForm
                  ? 'bg-[var(--color-surface-2)] text-[var(--color-text-soft)] hover:bg-[var(--color-surface-3)]'
                  : 'bg-primary-600 text-white hover:bg-primary-500'
              }`}
            >
              <Icon name={showForm ? 'x' : 'plus'} size={13} strokeWidth={2.5} />
              {showForm ? 'Cancelar' : 'Nuevo negocio'}
            </button>
            <button
              onClick={handleLogout}
              title="Cerrar sesión"
              className="rounded-lg p-2 text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text-soft)]"
            >
              <Icon name="logout" size={15} strokeWidth={1.75} />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6">

        {/* Create tenant form */}
        {showForm && (
          <div className="rounded-2xl p-5 mb-6 border border-[var(--border-subtle)] animate-slide" style={{ background: 'var(--color-surface-card)' }}>
            <h2 className="font-heading font-bold text-sm text-gray-900 mb-4">Nuevo negocio</h2>
            <form onSubmit={handleCreate} className="grid grid-cols-2 gap-3">
              {CREATE_FIELDS.map(({ field, label, type, placeholder, required, minLength }) => (
                <div key={field} className="col-span-2 sm:col-span-1">
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    {label}{!required && <span className="text-gray-400 font-normal"> (opcional)</span>}
                  </label>
                  <input
                    type={type} value={form[field] ?? ''} onChange={setField(field)}
                    placeholder={placeholder} required={required} minLength={minLength}
                    className="w-full text-sm border border-[var(--border-subtle)] rounded-xl px-3 py-2 bg-[var(--color-surface-2)] text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500/50 transition-colors"
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
          <PlansSection plans={plans} onUpdate={updatePlanDto} />
        )}

        {/* Tenant list */}
        <section>
          <div className="px-1 mb-3">
            <h2 className="font-heading font-bold text-sm text-gray-900">Negocios</h2>
            <p className="text-xs text-gray-400 mt-0.5">Gestión de tenants, planes y módulos</p>
          </div>

          <div className="rounded-2xl border border-[var(--border-subtle)] overflow-hidden" style={{ background: 'var(--color-surface-card)' }}>
            {loading ? (
              <div className="flex justify-center py-12"><Spinner /></div>
            ) : tenants.length === 0 ? (
              <div className="flex flex-col items-center py-14 text-center">
                <div className="w-10 h-10 rounded-xl bg-[var(--color-surface-2)] flex items-center justify-center mb-3">
                  <Icon name="building" size={20} strokeWidth={1.5} className="text-gray-300" />
                </div>
                <p className="text-sm text-gray-400">No hay negocios registrados</p>
                <p className="text-xs text-gray-300 mt-1">Crea el primero con el botón de arriba</p>
              </div>
            ) : (
              <div>
                {tenants.map((t, idx) => (
                  <div key={t.id} className={idx !== 0 ? 'border-t border-[var(--border-subtle)]' : ''}>
                    <div className="flex items-center gap-3 px-4 py-3 hover:bg-[var(--color-surface-2)] transition-colors">
                      <button
                        onClick={() => setExpandedId((prev) => prev === t.id ? null : t.id)}
                        className="p-1 rounded-lg text-gray-500 hover:text-gray-400 hover:bg-[var(--color-surface-2)] transition-colors shrink-0"
                        aria-expanded={expandedId === t.id}
                      >
                        <Icon
                          name="chevron-right"
                          size={16}
                          strokeWidth={2}
                          className={`transition-transform duration-200 ${expandedId === t.id ? 'rotate-90' : ''}`}
                        />
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
                        <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${t.isActive ? 'bg-emerald-500/15 text-emerald-400' : 'bg-red-500/15 text-red-400'}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${t.isActive ? 'bg-emerald-400' : 'bg-red-400'}`} />
                          {t.isActive ? 'Activo' : 'Inactivo'}
                        </span>
                      </div>

                      <button
                        onClick={() => handleToggle(t.id)}
                        disabled={toggling === t.id}
                        className={`shrink-0 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50 ${t.isActive ? 'bg-red-500/12 text-red-400 hover:bg-red-500/20' : 'bg-emerald-500/12 text-emerald-400 hover:bg-emerald-500/20'}`}
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
