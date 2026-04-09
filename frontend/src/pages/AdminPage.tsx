import { useState, useEffect, useCallback } from 'react';
import { SaasPlan } from '@pos/shared';
import { adminApi, type TenantRow, type TenantModules, type PlanRow, type CreateTenantPayload } from '../api/admin.api';
import { Button } from '../components/ui/Button';
import { Spinner } from '../components/ui/Spinner';

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-BO', { day: '2-digit', month: 'short', year: 'numeric' });
}

function limitLabel(n: number) {
  return n === -1 ? '∞' : String(n);
}

// ─── Plan badge ───────────────────────────────────────────────

const PLAN_COLORS: Record<SaasPlan, string> = {
  [SaasPlan.BASICO]:  'bg-gray-100 text-gray-600 border-gray-200',
  [SaasPlan.PRO]:     'bg-blue-100 text-blue-700 border-blue-200',
  [SaasPlan.NEGOCIO]: 'bg-violet-100 text-violet-700 border-violet-200',
};

function PlanBadge({ plan }: { plan: SaasPlan }) {
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${PLAN_COLORS[plan]}`}>
      {plan}
    </span>
  );
}

// ─── Module toggle row ────────────────────────────────────────

interface ModuleDef { key: keyof TenantModules; label: string; description: string; }

const MODULE_DEFS: ModuleDef[] = [
  { key: 'ordersEnabled',   label: 'Pedidos',   description: 'Seguimiento y estados de órdenes' },
  { key: 'cashEnabled',     label: 'Caja',       description: 'Apertura y cierre de turno con control de efectivo' },
  { key: 'teamEnabled',     label: 'Equipo',     description: 'Gestión de cajeros y sus sucursales asignadas' },
  { key: 'branchesEnabled', label: 'Sucursales', description: 'Administración de múltiples locales' },
  { key: 'kitchenEnabled',  label: 'Cocina',     description: 'Panel de visualización de pedidos en cocina' },
];

function ModuleToggleRow({ def, value, disabled, onChange }: {
  def: ModuleDef; value: boolean; disabled: boolean;
  onChange: (key: keyof TenantModules, value: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between py-2.5 px-3 rounded-xl hover:bg-gray-50 transition-colors">
      <div className="min-w-0 pr-4">
        <p className="text-sm font-semibold text-gray-800">{def.label}</p>
        <p className="text-xs text-gray-400 mt-0.5">{def.description}</p>
      </div>
      <button
        onClick={() => onChange(def.key, !value)}
        disabled={disabled}
        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed ${value ? 'bg-primary-500' : 'bg-gray-200'}`}
        role="switch" aria-checked={value}
      >
        <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform duration-200 ${value ? 'translate-x-4' : 'translate-x-0'}`} />
      </button>
    </div>
  );
}

// ─── Tenant detail panel ──────────────────────────────────────

function TenantPanel({
  tenant,
  plans,
  onPlanUpdate,
  onModulesUpdate,
}: {
  tenant: TenantRow;
  plans: PlanRow[];
  onPlanUpdate: (id: string, plan: SaasPlan) => void;
  onModulesUpdate: (id: string, modules: TenantModules) => void;
}) {
  const [modules, setModules] = useState<TenantModules>(tenant.modules);
  const [savingModule, setSavingModule] = useState<keyof TenantModules | null>(null);
  const [savingPlan, setSavingPlan] = useState(false);

  useEffect(() => { setModules(tenant.modules); }, [tenant.modules]);

  const activePlan = plans.find((p) => p.id === tenant.plan);

  const handlePlanChange = async (plan: SaasPlan) => {
    setSavingPlan(true);
    try {
      await adminApi.updateTenantPlan(tenant.id, plan);
      onPlanUpdate(tenant.id, plan);
    } finally {
      setSavingPlan(false);
    }
  };

  const handleModuleChange = async (key: keyof TenantModules, value: boolean) => {
    const updated = { ...modules, [key]: value };
    setModules(updated);
    setSavingModule(key);
    try {
      await adminApi.updateModules(tenant.id, { [key]: value });
      onModulesUpdate(tenant.id, updated);
    } catch {
      setModules(modules);
    } finally {
      setSavingModule(null);
    }
  };

  return (
    <div className="border-t border-gray-100 bg-gray-50/60">
      {/* Plan selector */}
      <div className="px-4 pt-4 pb-3 border-b border-gray-100">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Plan SaaS</p>
        <div className="flex gap-2 flex-wrap">
          {plans.map((p) => (
            <button
              key={p.id}
              onClick={() => handlePlanChange(p.id as SaasPlan)}
              disabled={savingPlan}
              className={[
                'flex flex-col px-4 py-2.5 rounded-xl border text-left transition-all text-sm',
                tenant.plan === p.id
                  ? 'border-primary-400 bg-primary-50 ring-2 ring-primary-200/50'
                  : 'border-gray-200 bg-white hover:border-gray-300',
                savingPlan ? 'opacity-50 cursor-not-allowed' : '',
              ].join(' ')}
            >
              <span className="font-bold text-gray-900">{p.displayName}</span>
              <span className="text-xs text-gray-500 mt-0.5">
                {limitLabel(p.maxBranches)} suc · {limitLabel(p.maxCashiers)} caj · {limitLabel(p.maxProducts)} prod
              </span>
            </button>
          ))}
        </div>

        {/* Usage stats */}
        {activePlan && (
          <div className="mt-3 flex gap-4 text-xs">
            <span className={tenant.branchCount >= activePlan.maxBranches && activePlan.maxBranches !== -1 ? 'text-red-500 font-semibold' : 'text-gray-500'}>
              Sucursales: <strong>{tenant.branchCount}</strong>/{limitLabel(activePlan.maxBranches)}
            </span>
            <span className={tenant.cashierCount >= activePlan.maxCashiers && activePlan.maxCashiers !== -1 ? 'text-red-500 font-semibold' : 'text-gray-500'}>
              Cajeros: <strong>{tenant.cashierCount}</strong>/{limitLabel(activePlan.maxCashiers)}
            </span>
          </div>
        )}
      </div>

      {/* Module overrides */}
      <div className="px-4 py-3">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2 px-3">
          Módulos (ajuste fino)
        </p>
        <div className="space-y-0.5">
          {MODULE_DEFS.map((def) => (
            <ModuleToggleRow
              key={def.key}
              def={def}
              value={modules[def.key]}
              disabled={savingModule === def.key}
              onChange={handleModuleChange}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Plans editor section ─────────────────────────────────────

function PlansSection({ plans, onUpdate }: { plans: PlanRow[]; onUpdate: (updated: PlanRow) => void }) {
  const [editing, setEditing] = useState<SaasPlan | null>(null);
  const [form, setForm] = useState<Partial<PlanRow>>({});
  const [saving, setSaving] = useState(false);

  const startEdit = (p: PlanRow) => {
    setEditing(p.id);
    setForm({ displayName: p.displayName, priceBs: p.priceBs, maxBranches: p.maxBranches, maxCashiers: p.maxCashiers, maxProducts: p.maxProducts, kitchenEnabled: p.kitchenEnabled });
  };

  const handleSave = async (id: SaasPlan) => {
    setSaving(true);
    try {
      const updated = await adminApi.updatePlan(id, form);
      onUpdate(updated);
      setEditing(null);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white/90 rounded-2xl shadow-[0_8px_24px_oklch(0.13_0.012_260/0.10)] border border-white/70 overflow-hidden backdrop-blur-sm mb-6">
      <div className="px-5 py-4 border-b border-gray-100">
        <h2 className="font-heading font-bold text-base text-gray-900">Planes</h2>
        <p className="text-xs text-gray-400 mt-0.5">Edita los límites y precio de cada plan</p>
      </div>
      <div className="divide-y divide-gray-100">
        {plans.map((p) => (
          <div key={p.id} className="px-5 py-4">
            {editing === p.id ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2 mb-1">
                  <PlanBadge plan={p.id} />
                  <span className="text-xs text-gray-400">editando</span>
                </div>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {[
                    { label: 'Nombre', field: 'displayName', type: 'text' },
                    { label: 'Precio (Bs)', field: 'priceBs', type: 'number' },
                    { label: 'Máx sucursales (-1=∞)', field: 'maxBranches', type: 'number' },
                    { label: 'Máx cajeros (-1=∞)', field: 'maxCashiers', type: 'number' },
                    { label: 'Máx productos (-1=∞)', field: 'maxProducts', type: 'number' },
                  ].map(({ label, field, type }) => (
                    <div key={field}>
                      <label className="block text-xs font-medium text-gray-500 mb-1">{label}</label>
                      <input
                        type={type}
                        value={String(form[field as keyof typeof form] ?? '')}
                        onChange={(e) => setForm((prev) => ({
                          ...prev,
                          [field]: type === 'number' ? Number(e.target.value) : e.target.value,
                        }))}
                        className="w-full text-sm border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary-400/30"
                      />
                    </div>
                  ))}
                  <div className="flex items-center gap-2 pt-5">
                    <label className="text-sm font-medium text-gray-700">Cocina</label>
                    <button
                      onClick={() => setForm((prev) => ({ ...prev, kitchenEnabled: !prev.kitchenEnabled }))}
                      className={`relative inline-flex h-5 w-9 rounded-full border-2 border-transparent transition-colors ${form.kitchenEnabled ? 'bg-primary-500' : 'bg-gray-200'}`}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${form.kitchenEnabled ? 'translate-x-4' : 'translate-x-0'}`} />
                    </button>
                  </div>
                </div>
                <div className="flex gap-2 pt-1">
                  <button onClick={() => setEditing(null)} className="text-sm text-gray-500 hover:text-gray-700 px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50">
                    Cancelar
                  </button>
                  <button
                    onClick={() => handleSave(p.id)}
                    disabled={saving}
                    className="text-sm font-semibold bg-primary-600 text-white px-4 py-1.5 rounded-lg hover:bg-primary-700 disabled:opacity-50"
                  >
                    {saving ? 'Guardando…' : 'Guardar'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 flex-wrap">
                  <PlanBadge plan={p.id} />
                  <span className="text-sm font-semibold text-gray-900">Bs {p.priceBs}/mes</span>
                  <span className="text-xs text-gray-500">
                    {limitLabel(p.maxBranches)} suc · {limitLabel(p.maxCashiers)} caj · {limitLabel(p.maxProducts)} prod
                    {p.kitchenEnabled && ' · cocina'}
                  </span>
                </div>
                <button
                  onClick={() => startEdit(p)}
                  className="shrink-0 text-xs font-medium text-primary-600 hover:text-primary-700 px-3 py-1.5 rounded-lg hover:bg-primary-50 transition-colors"
                >
                  Editar
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main AdminPage ───────────────────────────────────────────

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
  const emptyForm: CreateTenantPayload = { businessName: '', ownerName: '', email: '', password: '' };
  const [form, setForm] = useState<CreateTenantPayload>(emptyForm);

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

  const handlePlanUpdate = (id: string, plan: SaasPlan) => {
    setTenants((prev) => prev.map((t) => t.id === id ? { ...t, plan } : t));
  };

  const handleModulesUpdate = (id: string, modules: TenantModules) => {
    setTenants((prev) => prev.map((t) => t.id === id ? { ...t, modules } : t));
  };

  const handlePlanRowUpdate = (updated: PlanRow) => {
    setPlans((prev) => prev.map((p) => p.id === updated.id ? updated : p));
  };

  const handleLogout = () => { adminApi.clearKey(); setAuthenticated(false); setTenants([]); setKeyInput(''); };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setCreateError('');
    try {
      await adminApi.createTenant(form);
      setForm(emptyForm);
      setShowForm(false);
      await loadData();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setCreateError(typeof msg === 'string' ? msg : 'Error al crear el negocio');
    } finally {
      setCreating(false);
    }
  };

  const setField = (field: keyof CreateTenantPayload) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  // ── Login screen ──────────────────────────────────────────
  if (!authenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-[linear-gradient(165deg,oklch(0.975_0.006_250),oklch(0.955_0.012_248))]">
        <div className="w-full max-w-xs bg-white/85 backdrop-blur-xl rounded-2xl p-8 shadow-[0_14px_40px_oklch(0.13_0.012_260/0.16)] border border-white/70">
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
              type="password" value={keyInput} onChange={(e) => setKeyInput(e.target.value)}
              placeholder="Clave de administrador"
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-gray-400"
              autoFocus
            />
            {keyError && <p className="text-xs text-red-500">{keyError}</p>}
            <Button type="submit" variant="primary" fullWidth>Entrar</Button>
          </form>
        </div>
      </div>
    );
  }

  // ── Authenticated panel ───────────────────────────────────
  return (
    <div className="min-h-screen bg-[linear-gradient(165deg,oklch(0.975_0.006_250),oklch(0.955_0.012_248))] p-6">
      <div className="max-w-4xl mx-auto">

        {/* Header */}
        <div className="rounded-2xl border border-white/70 bg-white/80 backdrop-blur-xl shadow-[0_10px_30px_oklch(0.13_0.012_260/0.10)] p-4 sm:p-5 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-heading font-black text-2xl text-gray-900">Panel de Admin</h1>
              <p className="text-sm text-gray-500 mt-0.5">{tenants.length} negocio{tenants.length !== 1 ? 's' : ''} registrado{tenants.length !== 1 ? 's' : ''}</p>
            </div>
            <div className="flex items-center gap-3">
              <Button size="sm" variant="primary" onClick={() => { setShowForm((v) => !v); setCreateError(''); }}>
                {showForm ? 'Cancelar' : '+ Nuevo negocio'}
              </Button>
              <button onClick={handleLogout} className="text-xs text-gray-400 hover:text-gray-600 underline">Salir</button>
            </div>
          </div>
        </div>

        {/* Create tenant form */}
        {showForm && (
          <div className="bg-white/90 rounded-2xl p-6 mb-6 shadow-[0_8px_24px_oklch(0.13_0.012_260/0.10)] border border-white/70 backdrop-blur-sm">
            <h2 className="font-heading font-bold text-base text-gray-900 mb-4">Nuevo negocio</h2>
            <form onSubmit={handleCreate} className="grid grid-cols-2 gap-3">
              {([
                ['businessName', 'Nombre del negocio', 'text', 'Ej: HamBurgos'],
                ['ownerName', 'Nombre del dueño', 'text', 'Ej: Juan Pérez'],
                ['email', 'Email', 'email', 'correo@ejemplo.com'],
                ['password', 'Contraseña inicial', 'text', 'Mínimo 6 caracteres'],
              ] as [keyof CreateTenantPayload, string, string, string][]).map(([field, label, type, placeholder]) => (
                <div key={field} className="col-span-2 sm:col-span-1">
                  <label className="block text-xs font-medium text-gray-500 mb-1">{label}</label>
                  <input type={type} value={form[field]} onChange={setField(field)}
                    placeholder={placeholder} required minLength={field === 'password' ? 6 : undefined}
                    className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-400"
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

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { label: 'Total',     value: tenants.length,                            color: 'text-gray-900' },
            { label: 'Activos',   value: tenants.filter((t) => t.isActive).length,  color: 'text-green-600' },
            { label: 'Inactivos', value: tenants.filter((t) => !t.isActive).length, color: 'text-red-500' },
          ].map((s) => (
            <div key={s.label} className="bg-white/90 rounded-xl p-4 shadow-[0_6px_20px_oklch(0.13_0.012_260/0.08)] border border-white/70 text-center backdrop-blur-sm">
              <p className={`font-heading font-black text-2xl ${s.color}`}>{s.value}</p>
              <p className="text-xs text-gray-400 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Plans editor */}
        {plans.length > 0 && (
          <PlansSection plans={plans} onUpdate={handlePlanRowUpdate} />
        )}

        {/* Tenant list */}
        <div className="bg-white/90 rounded-2xl shadow-[0_8px_24px_oklch(0.13_0.012_260/0.10)] border border-white/70 overflow-hidden backdrop-blur-sm">
          {loading ? (
            <div className="flex justify-center py-12"><Spinner /></div>
          ) : tenants.length === 0 ? (
            <p className="text-center text-sm text-gray-400 py-12">No hay negocios registrados</p>
          ) : (
            <div>
              {tenants.map((t, idx) => (
                <div key={t.id} className={idx !== 0 ? 'border-t border-gray-100' : ''}>
                  {/* Tenant row */}
                  <div className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50/50 transition-colors">
                    <button
                      onClick={() => setExpandedId((prev) => prev === t.id ? null : t.id)}
                      className="p-1 rounded-lg text-gray-300 hover:text-gray-500 hover:bg-gray-100 transition-colors shrink-0"
                    >
                      <svg className={`w-4 h-4 transition-transform duration-200 ${expandedId === t.id ? 'rotate-90' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>

                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-gray-900 truncate">{t.name}</p>
                      <p className="text-xs text-gray-400 truncate">{t.slug}</p>
                    </div>

                    <div className="hidden sm:block w-40 shrink-0">
                      {t.owner ? (
                        <>
                          <p className="text-sm text-gray-700 truncate">{t.owner.name}</p>
                          <p className="text-xs text-gray-400 truncate">{t.owner.email}</p>
                        </>
                      ) : <span className="text-gray-300 text-sm">—</span>}
                    </div>

                    <div className="hidden md:block w-24 shrink-0 text-sm text-gray-500">
                      {formatDate(t.createdAt)}
                    </div>

                    {/* Plan badge */}
                    <div className="shrink-0">
                      <PlanBadge plan={t.plan} />
                    </div>

                    {/* Status */}
                    <div className="shrink-0">
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
                      {toggling === t.id ? '...' : t.isActive ? 'Desactivar' : 'Activar'}
                    </button>
                  </div>

                  {/* Detail panel */}
                  {expandedId === t.id && (
                    <TenantPanel
                      tenant={t}
                      plans={plans}
                      onPlanUpdate={handlePlanUpdate}
                      onModulesUpdate={handleModulesUpdate}
                    />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
