import { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { isUnlimited } from '@pos/shared';
import { ADMIN_KEY_INVALID_EVENT, adminApi, type CreateTenantPayload, type PlanDto, type TenantRow } from '../api/admin.api';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { ConfirmModal } from '../components/ui/ConfirmModal';
import { EmptyState } from '../components/ui/EmptyState';
import { Icon } from '../components/ui/Icon';
import { Input } from '../components/ui/Input';
import { SegmentedControl } from '../components/ui/SegmentedControl';
import { Skeleton } from '../components/ui/Skeleton';
import { AdminLogin } from '../components/admin/AdminLogin';
import { PlansSection } from '../components/admin/PlansSection';
import { TenantFormModal } from '../components/admin/TenantFormModal';
import { TenantSheet } from '../components/admin/TenantSheet';
import { PlanBadge } from '../components/admin/PlanBadge';
import { useTheme } from '../hooks/useTheme';
import { handleApiError } from '../utils/api-error';
import { formatBoliviaDateShort } from '../utils/date';

type Tab = 'tenants' | 'plans';

/**
 * Algo a revisar en un negocio, con lo que ya trae la lista (el chequeo completo vive en la
 * ficha): sin dueño, sin sucursal o por encima de un límite de su plan.
 */
function attention(t: TenantRow, plan: PlanDto | undefined): string | null {
  if (!t.owner) return 'Sin dueño';
  if (t.branchCount === 0) return 'Sin sucursal';
  if (plan) {
    const over = (used: number, max: number) => !isUnlimited(max) && used > max;
    if (over(t.branchCount, plan.maxBranches) || over(t.cashierCount, plan.maxCashiers) || over(t.productCount, plan.maxProducts)) {
      return 'Por encima del plan';
    }
  }
  return null;
}

export function AdminPage() {
  const { theme, toggle: toggleTheme } = useTheme();
  const [authenticated, setAuthenticated] = useState(adminApi.hasKey());
  const [keyInput, setKeyInput] = useState('');
  const [keyError, setKeyError] = useState('');
  const [signingIn, setSigningIn] = useState(false);
  const [tenants, setTenants] = useState<TenantRow[]>([]);
  const [plans, setPlans] = useState<PlanDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<Tab>('tenants');
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [toggling, setToggling] = useState<TenantRow | null>(null);
  const [busy, setBusy] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [t, p] = await Promise.all([adminApi.getTenants(), adminApi.getPlans()]);
      setTenants(t);
      setPlans(p);
    } catch (err) {
      // Un 401 ya lo atiende ADMIN_KEY_INVALID_EVENT; cualquier otro error se muestra.
      handleApiError(err, 'No se pudieron cargar los negocios');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { if (authenticated) void loadData(); }, [authenticated, loadData]);

  // La clave dejó de servir a mitad de sesión: de vuelta al ingreso, con el motivo.
  useEffect(() => {
    const onInvalid = () => {
      setAuthenticated(false);
      setSelectedId(null);
      setCreating(false);
      setToggling(null);
      setKeyError('La clave dejó de ser válida. Ingrésala de nuevo.');
    };
    window.addEventListener(ADMIN_KEY_INVALID_EVENT, onInvalid);
    return () => window.removeEventListener(ADMIN_KEY_INVALID_EVENT, onInvalid);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setKeyError('');
    setSigningIn(true);
    try {
      await adminApi.ping(keyInput.trim());
      adminApi.saveKey(keyInput.trim());
      setAuthenticated(true);
    } catch {
      setKeyError('Clave incorrecta');
    } finally {
      setSigningIn(false);
    }
  };

  const handleLogout = () => {
    adminApi.clearKey();
    setAuthenticated(false);
    setTenants([]);
    setKeyInput('');
  };

  const updateTenant = (id: string, changes: Partial<TenantRow>) =>
    setTenants((prev) => prev.map((t) => (t.id === id ? { ...t, ...changes } : t)));

  const updatePlan = (updated: PlanDto) =>
    setPlans((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));

  const createTenant = async (data: CreateTenantPayload) => {
    try {
      await adminApi.createTenant(data);
      toast.success(`${data.businessName} creado`);
      setCreating(false);
      await loadData();
    } catch (err) {
      handleApiError(err, 'No se pudo crear el negocio');
    }
  };

  const confirmToggle = async () => {
    if (!toggling) return;
    setBusy(true);
    try {
      const updated = await adminApi.toggleTenant(toggling.id);
      updateTenant(toggling.id, { isActive: updated.isActive });
      toast.success(updated.isActive ? `${toggling.name} reactivado` : `${toggling.name} suspendido`);
      setToggling(null);
    } catch (err) {
      handleApiError(err, 'No se pudo cambiar el estado del negocio');
    } finally {
      setBusy(false);
    }
  };

  const planOf = (t: TenantRow) => plans.find((p) => p.id === t.plan);
  const activeCount = tenants.filter((t) => t.isActive).length;
  const q = search.trim().toLowerCase();
  const visible = useMemo(() => [...tenants]
    .filter((t) => !q || [t.name, t.slug, t.owner?.name, t.owner?.email].some((v) => v?.toLowerCase().includes(q)))
    .sort((a, b) => Number(b.isActive) - Number(a.isActive) || a.name.localeCompare(b.name, 'es')),
  [tenants, q]);
  const selected = tenants.find((t) => t.id === selectedId) ?? null;

  if (!authenticated) {
    return <AdminLogin keyInput={keyInput} keyError={keyError} loading={signingIn} onKeyChange={(v) => { setKeyInput(v); setKeyError(''); }} onSubmit={handleLogin} />;
  }

  return (
    <div className="min-h-dvh bg-surface-page">
      <header className="sticky top-0 z-20 border-b border-line bg-surface-page/85 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-3 px-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-2.5">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-control bg-primary-600 text-white shadow-raised">
              <Icon name="cart" size={18} strokeWidth={2} />
            </span>
            <span className="truncate font-heading text-heading font-bold text-main">
              Yanko<span className="text-primary-600 dark:text-primary-400">POS</span>
              <span className="ml-2 hidden text-body font-medium text-soft sm:inline">Administración</span>
            </span>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={theme === 'dark' ? 'Usar tema claro' : 'Usar tema oscuro'}
              className="flex h-10 w-10 items-center justify-center rounded-control text-soft transition-colors hover:bg-surface-2 hover:text-main focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/60"
            >
              <Icon name={theme === 'dark' ? 'sun' : 'moon'} size={18} />
            </button>
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <Icon name="logout" size={16} />
              Salir
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="font-heading text-title font-bold text-main">Panel de administración</h1>
            <p className="mt-1 text-body text-soft">
              {tenants.length === 1 ? '1 negocio' : `${tenants.length} negocios`}, {activeCount === 1 ? '1 activo' : `${activeCount} activos`}.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <SegmentedControl
              label="Sección"
              value={tab}
              onChange={setTab}
              options={[{ value: 'tenants', label: 'Negocios' }, { value: 'plans', label: 'Planes' }]}
            />
            {tab === 'tenants' && (
              <Button onClick={() => setCreating(true)}>
                <Icon name="plus" size={18} />
                Nuevo negocio
              </Button>
            )}
          </div>
        </div>

        {tab === 'plans' ? (
          loading ? <div className="grid gap-4 md:grid-cols-3"><Skeleton variant="card" /><Skeleton variant="card" /><Skeleton variant="card" /></div>
            : <PlansSection plans={plans} onUpdate={updatePlan} />
        ) : (
          <>
            {tenants.length > 5 && (
              <div className="mb-4">
                <Input
                  aria-label="Buscar negocio"
                  placeholder="Buscar por negocio, dueño o correo"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  leftAddon={<Icon name="search" size={18} />}
                />
              </div>
            )}
            {loading ? (
              <div className="space-y-3"><Skeleton variant="card" /><Skeleton variant="card" /></div>
            ) : visible.length === 0 ? (
              <EmptyState
                icon="building"
                title={q ? 'Ningún negocio con esa búsqueda' : 'Todavía no hay negocios'}
                description={q ? 'Prueba con otro nombre o correo.' : 'Crea el primero con su dueño y su sucursal.'}
                action={q ? undefined : <Button onClick={() => setCreating(true)}>Crear el primero</Button>}
              />
            ) : (
              <section className="overflow-hidden rounded-card border border-line bg-surface-card shadow-raised">
                <ul className="divide-y divide-line">
                  {visible.map((t) => {
                    const warn = attention(t, planOf(t));
                    return (
                      <li key={t.id}>
                        <button
                          type="button"
                          onClick={() => setSelectedId(t.id)}
                          className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-surface-2 focus-visible:bg-surface-2 focus-visible:outline-none"
                        >
                          <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-control border border-line font-heading text-body font-bold ${
                            t.isActive ? 'bg-primary-500/10 text-primary-700 dark:text-primary-400' : 'bg-surface-2 text-muted'
                          }`}>
                            {t.name.trim().charAt(0).toUpperCase()}
                          </span>
                          <span className={`min-w-0 flex-1 ${t.isActive ? '' : 'opacity-60'}`}>
                            <span className="flex flex-wrap items-center gap-2">
                              <span className="min-w-0 truncate text-body font-semibold text-main">{t.name}</span>
                              <PlanBadge plan={t.plan} />
                              {!t.isActive && <Badge variant="error" dot>Suspendido</Badge>}
                              {t.isActive && warn && <Badge variant="warning" dot>{warn}</Badge>}
                            </span>
                            <span className="block truncate text-caption text-muted">
                              {t.owner ? `${t.owner.name}, ${t.owner.email}` : 'Sin dueño'}. Alta el {formatBoliviaDateShort(t.createdAt)}
                            </span>
                          </span>
                          <span className="hidden shrink-0 text-right text-caption text-muted tabular-nums sm:block">
                            {t.branchCount} suc.<br />{t.cashierCount} cajeros
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </section>
            )}
          </>
        )}
      </main>

      {selected && (
        <TenantSheet
          tenant={selected}
          plans={plans}
          onClose={() => setSelectedId(null)}
          onChange={updateTenant}
          onToggleActive={() => setToggling(selected)}
        />
      )}

      {creating && <TenantFormModal onClose={() => setCreating(false)} onSubmit={createTenant} />}

      <ConfirmModal
        isOpen={toggling !== null}
        onClose={() => setToggling(null)}
        onConfirm={confirmToggle}
        loading={busy}
        variant={toggling?.isActive ? 'danger' : 'primary'}
        title={toggling ? (toggling.isActive ? `Suspender ${toggling.name}` : `Reactivar ${toggling.name}`) : ''}
        message={toggling?.isActive
          ? 'El dueño y todos sus cajeros quedan fuera al instante: nadie podrá iniciar sesión. No se borra ningún dato y puedes reactivarlo cuando quieras.'
          : 'El dueño y sus cajeros vuelven a poder iniciar sesión con sus contraseñas.'}
        confirmLabel={toggling?.isActive ? 'Suspender' : 'Reactivar'}
        cancelLabel="Volver"
      />
    </div>
  );
}
