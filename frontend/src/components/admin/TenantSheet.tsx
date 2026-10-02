import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { SaasPlan, isUnlimited } from '@pos/shared';
import {
  adminApi, type PlanDto, type PlanExcess, type TenantHealth, type TenantModules, type TenantRow,
} from '../../api/admin.api';
import { ActionList, ActionRow, SheetSection } from '../ui/ActionRow';
import { Badge } from '../ui/Badge';
import { ConfirmModal } from '../ui/ConfirmModal';
import { Icon } from '../ui/Icon';
import { Modal } from '../ui/Modal';
import { Skeleton } from '../ui/Skeleton';
import { Toggle } from '../ui/Toggle';
import { MODULE_DEFS, PLAN_ORDER, PlanBadge, limitLabel, planModules, storageLabel } from './PlanBadge';
import { handleApiError } from '../../utils/api-error';
import { formatBoliviaDayMonth } from '../../utils/date';
import { Notice } from '../ui/Notice';
import { Avatar } from '../ui/Avatar';
import { NewPasswordModal } from '../ui/NewPasswordModal';

function Usage({ label, used, max, format = limitLabel }: { label: string; used: number; max: number; format?: (n: number) => string }) {
  const over = !isUnlimited(max) && used >= max;
  return (
    <div className={`rounded-control border px-3 py-2.5 ${over ? 'border-amber-500/30 bg-amber-500/10' : 'border-line bg-surface-2'}`}>
      <p className="text-caption text-muted">{label}</p>
      <p className={`mt-0.5 text-body font-semibold tabular-nums ${over ? 'text-amber-800 dark:text-amber-300' : 'text-main'}`}>
        {format === limitLabel ? used : format(used)} <span className="font-normal text-soft">de {format(max)}</span>
      </p>
    </div>
  );
}

function Check({ ok, text }: { ok: boolean; text: string }) {
  return (
    <li className="flex items-start gap-2.5 text-label">
      <span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
        ok ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400' : 'bg-amber-500/15 text-amber-800 dark:text-amber-300'
      }`}>
        <Icon name={ok ? 'check' : 'warning'} size={12} strokeWidth={2.5} />
      </span>
      <span className={ok ? 'text-soft' : 'font-medium text-main'}>{text}</span>
    </li>
  );
}

/** Módulos que cambian entre dos planes, contando solo lo que trae cada plan. */
function moduleChanges(from: PlanDto, to: PlanDto) {
  const a = planModules(from);
  const b = planModules(to);
  const lost   = MODULE_DEFS.filter((m) => a[m.key] && !b[m.key]).map((m) => m.label);
  const gained = MODULE_DEFS.filter((m) => !a[m.key] && b[m.key]).map((m) => m.label);
  return { lost, gained };
}


/**
 * Ficha de un negocio: uso del plan, chequeo de alta, plan (con confirmación), módulos con su
 * origen (del plan o excepción) y la cuenta del dueño. Suspender lo confirma la página.
 */
export function TenantSheet({ tenant, plans, onClose, onChange, onToggleActive }: {
  tenant: TenantRow;
  plans: PlanDto[];
  onClose: () => void;
  onChange: (id: string, changes: Partial<TenantRow>) => void;
  onToggleActive: () => void;
}) {
  const [health, setHealth]     = useState<TenantHealth | null>(null);
  const [pendingPlan, setPendingPlan] = useState<PlanDto | null>(null);
  const [savingPlan, setSavingPlan]   = useState(false);
  const [excess, setExcess]     = useState<PlanExcess[]>([]);
  const [savingModule, setSavingModule] = useState<keyof TenantModules | null>(null);
  const [passwordOpen, setPasswordOpen] = useState(false);

  const plan = plans.find((p) => p.id === tenant.plan);
  const base = plan ? planModules(plan) : null;
  const ordered = PLAN_ORDER.map((id) => plans.find((p) => p.id === id)).filter((p): p is PlanDto => !!p);

  // El chequeo depende del plan y los módulos: se vuelve a pedir cuando cambian.
  useEffect(() => {
    let alive = true;
    setHealth(null);
    adminApi.getTenantHealth(tenant.id)
      .then((h) => { if (alive) setHealth(h); })
      .catch(() => { /* el chequeo es informativo: sin él la ficha sigue sirviendo */ });
    return () => { alive = false; };
  }, [tenant.id, tenant.plan, tenant.modules, tenant.isActive]);

  const confirmPlan = async () => {
    if (!pendingPlan) return;
    setSavingPlan(true);
    try {
      const result = await adminApi.updateTenantPlan(tenant.id, pendingPlan.id as SaasPlan);
      onChange(tenant.id, {
        plan: result.plan,
        modules: {
          ordersEnabled: result.ordersEnabled, cashEnabled: result.cashEnabled, teamEnabled: result.teamEnabled,
          branchesEnabled: result.branchesEnabled, kitchenEnabled: result.kitchenEnabled,
          rafflesEnabled: result.rafflesEnabled, advancedReportsEnabled: result.advancedReportsEnabled,
        },
      });
      // Nada se desactiva solo: bajar de plan conserva los datos y se avisa qué quedó encima.
      setExcess(result.excess ?? []);
      toast.success(`${tenant.name} ahora está en el plan ${pendingPlan.displayName}`);
      setPendingPlan(null);
    } catch (err) {
      handleApiError(err, 'No se pudo cambiar el plan');
    } finally {
      setSavingPlan(false);
    }
  };

  const toggleModule = async (key: keyof TenantModules) => {
    const value = !tenant.modules[key];
    setSavingModule(key);
    try {
      await adminApi.updateModules(tenant.id, { [key]: value });
      onChange(tenant.id, { modules: { ...tenant.modules, [key]: value } });
    } catch (err) {
      handleApiError(err, 'No se pudo cambiar el módulo');
    } finally {
      setSavingModule(null);
    }
  };

  const resetPassword = async (password: string) => {
    if (!tenant.owner) return;
    try {
      await adminApi.resetUserPassword(tenant.owner.id, password);
      toast.success(`Contraseña de ${tenant.owner.name} cambiada`);
      setPasswordOpen(false);
    } catch (err) {
      handleApiError(err, 'No se pudo cambiar la contraseña');
    }
  };

  const changes = plan && pendingPlan ? moduleChanges(plan, pendingPlan) : { lost: [], gained: [] };
  const downgrade = !!(plan && pendingPlan && pendingPlan.priceBs < plan.priceBs);
  // Lo que quedaría por encima, con los números del negocio (el servidor lo confirma al cambiar).
  const over = pendingPlan ? [
    { used: tenant.branchCount,  max: pendingPlan.maxBranches, what: 'sucursales' },
    { used: tenant.cashierCount, max: pendingPlan.maxCashiers, what: 'cajeros' },
    { used: tenant.productCount, max: pendingPlan.maxProducts, what: 'productos' },
  ].filter((r) => !isUnlimited(r.max) && r.used > r.max) : [];
  const planMessage = [
    changes.lost.length ? `Deja de tener: ${changes.lost.join(', ')}.` : '',
    changes.gained.length ? `Suma: ${changes.gained.join(', ')}.` : '',
    over.length
      ? `Quedaría por encima del plan (${over.map((r) => `${r.used} ${r.what} y el plan permite ${r.max}`).join('; ')}): conserva todo, pero no podrá crear más hasta bajar.`
      : '',
    'No se borra ningún dato. Las excepciones que diste a mano se mantienen.',
  ].filter(Boolean).join(' ');

  return (
    <Modal isOpen onClose={onClose} title="Negocio" size="lg">
      <div className="space-y-6">
        <div className="flex items-start gap-4">
          <Avatar name={tenant.name} size="lg" square />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="min-w-0 truncate text-heading font-semibold text-main">{tenant.name}</p>
              <PlanBadge plan={tenant.plan} />
              {tenant.isActive ? <Badge variant="success" dot>Activo</Badge> : <Badge variant="error" dot>Suspendido</Badge>}
            </div>
            <p className="truncate text-body text-soft">
              {tenant.owner ? `${tenant.owner.name}, ${tenant.owner.email}` : 'Sin dueño registrado'}
            </p>
            <p className="text-caption text-muted">Alta el {formatBoliviaDayMonth(tenant.createdAt)}. Identificador: {tenant.slug}</p>
          </div>
        </div>

        {plan && (
          <SheetSection title="Uso del plan">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <Usage label="Sucursales" used={tenant.branchCount} max={plan.maxBranches} />
              <Usage label="Cajeros" used={tenant.cashierCount} max={plan.maxCashiers} />
              <Usage label="Productos" used={tenant.productCount} max={plan.maxProducts} />
              <Usage label="Fotos" used={tenant.storageUsedMb} max={plan.maxStorageMb} format={storageLabel} />
            </div>
            <p className="mt-2 text-caption text-muted">
              Reportes: {isUnlimited(plan.reportHistoryDays) ? 'historial completo' : `últimos ${plan.reportHistoryDays} días`}.
            </p>
          </SheetSection>
        )}

        <SheetSection title="Chequeo de alta">
          {!health ? (
            <Skeleton variant="rect" h="96px" />
          ) : (
            <div className="rounded-card border border-line px-4 py-3">
              <p className={`mb-2 text-label font-semibold ${health.ok ? 'text-emerald-700 dark:text-emerald-400' : 'text-amber-800 dark:text-amber-300'}`}>
                {health.ok ? 'Listo para operar' : 'Falta algo para que opere'}
              </p>
              <ul className="space-y-1.5">
                <Check ok={health.isActive} text={health.isActive ? 'Cuenta activa' : 'Cuenta suspendida: nadie puede iniciar sesión'} />
                <Check ok={health.hasActiveOwner} text={health.hasActiveOwner ? 'Dueño activo' : 'No tiene un dueño activo'} />
                <Check ok={health.hasBranch} text={health.hasBranch ? 'Tiene sucursal' : 'No tiene sucursales'} />
                <Check ok={health.hasProducts} text={health.hasProducts ? 'Tiene productos cargados' : 'Todavía no cargó productos'} />
                <Check
                  ok={health.withinBranchLimit && health.withinCashierLimit && health.withinProductLimit}
                  text={health.withinBranchLimit && health.withinCashierLimit && health.withinProductLimit ? 'Dentro de los límites del plan' : 'Por encima de algún límite del plan'}
                />
              </ul>
            </div>
          )}
        </SheetSection>

        <SheetSection title="Plan">
          <div role="radiogroup" aria-label="Plan del negocio" className="grid gap-2 sm:grid-cols-3">
            {ordered.map((p) => {
              const current = p.id === tenant.plan;
              return (
                <button
                  key={p.id}
                  type="button"
                  role="radio"
                  aria-checked={current}
                  disabled={current}
                  onClick={() => setPendingPlan(p)}
                  className={`rounded-card border px-4 py-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/60 ${
                    current ? 'border-primary-600 bg-primary-500/8 ring-1 ring-primary-600' : 'border-line bg-surface-card hover:border-line-strong'
                  }`}
                >
                  <span className="flex items-center justify-between gap-2">
                    <span className="text-body font-semibold text-main">{p.displayName}</span>
                    {current && <span className="text-caption font-semibold text-primary-700 dark:text-primary-400">Actual</span>}
                  </span>
                  <span className="mt-0.5 block text-label text-soft tabular-nums">Bs {p.priceBs} al mes</span>
                  <span className="block text-caption text-muted">
                    {limitLabel(p.maxBranches)} suc., {limitLabel(p.maxCashiers)} cajeros
                  </span>
                </button>
              );
            })}
          </div>
          {excess.length > 0 && (
            <Notice className="mt-3">
              <p className="font-semibold">Quedó por encima de su plan nuevo</p>
              <ul className="mt-1 space-y-0.5">
                {excess.map((e) => <li key={e.resource}>Tiene {e.current} {e.resource} y el plan permite {e.max}.</li>)}
              </ul>
              <p className="mt-1">No se desactivó nada: conserva sus datos y no podrá crear más hasta volver al límite.</p>
            </Notice>
          )}
        </SheetSection>

        <SheetSection title="Módulos">
          <ul className="overflow-hidden rounded-card border border-line divide-y divide-line">
            {MODULE_DEFS.map((m) => {
              const on = tenant.modules[m.key];
              const exception = base ? base[m.key] !== on : false;
              return (
                <li key={m.key} className="flex items-center gap-3 px-4 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="flex flex-wrap items-center gap-2 text-body font-semibold text-main">
                      {m.label}
                      {exception && <Badge variant="warning">Excepción</Badge>}
                    </p>
                    <p className="text-label text-soft">
                      {m.description}. {exception ? (on ? 'Su plan no lo incluye: lo diste a mano.' : 'Su plan lo incluye: lo apagaste a mano.') : 'Según su plan.'}
                    </p>
                  </div>
                  <Toggle checked={on} onChange={() => toggleModule(m.key)} disabled={savingModule !== null} label={m.label} />
                </li>
              );
            })}
          </ul>
          <p className="mt-2 text-caption text-muted">Volver al valor del plan borra la excepción.</p>
        </SheetSection>

        <SheetSection title="Cuenta">
          <ActionList>
            {tenant.owner && (
              <ActionRow
                icon="lock"
                title="Cambiar la contraseña del dueño"
                description={`Para ${tenant.owner.name}, si la olvidó. La anterior deja de funcionar.`}
                onClick={() => setPasswordOpen(true)}
              />
            )}
            {tenant.isActive ? (
              <ActionRow icon="ban" title="Suspender negocio" description="Nadie del negocio podrá iniciar sesión. Sus datos se conservan." onClick={onToggleActive} danger />
            ) : (
              <ActionRow icon="check" title="Reactivar negocio" description="El dueño y sus cajeros vuelven a poder iniciar sesión." onClick={onToggleActive} />
            )}
          </ActionList>
        </SheetSection>
      </div>

      <ConfirmModal
        isOpen={pendingPlan !== null}
        onClose={() => setPendingPlan(null)}
        onConfirm={confirmPlan}
        loading={savingPlan}
        variant={downgrade ? 'danger' : 'primary'}
        title={pendingPlan ? `Pasar ${tenant.name} al plan ${pendingPlan.displayName}` : ''}
        message={planMessage}
        confirmLabel="Cambiar plan"
        cancelLabel="Volver"
      />

      {passwordOpen && tenant.owner && (
        <NewPasswordModal name={tenant.owner.name} onClose={() => setPasswordOpen(false)} onSubmit={resetPassword} />
      )}
    </Modal>
  );
}
