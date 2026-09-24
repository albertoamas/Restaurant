import { useState, useEffect } from 'react';
import { SaasPlan, isUnlimited } from '@pos/shared';
import { adminApi, type TenantRow, type TenantModules, type PlanDto, type TenantPlanUpdateResponse, type PlanExcess } from '../../api/admin.api';
import { PlanBadge, PLAN_CONFIG, limitLabel } from './PlanBadge';
import toast from 'react-hot-toast';

interface ModuleDef { key: keyof TenantModules; label: string; description: string; }

const MODULE_DEFS: ModuleDef[] = [
  { key: 'ordersEnabled',   label: 'Pedidos',   description: 'Seguimiento y estados de órdenes' },
  { key: 'cashEnabled',     label: 'Caja',       description: 'Apertura y cierre de turno con control de efectivo' },
  { key: 'teamEnabled',     label: 'Equipo',     description: 'Gestión de cajeros y sus sucursales asignadas' },
  { key: 'branchesEnabled', label: 'Sucursales', description: 'Administración de múltiples locales' },
  { key: 'kitchenEnabled',  label: 'Cocina',     description: 'Panel de visualización de pedidos en cocina' },
  { key: 'rafflesEnabled',  label: 'Sorteos',    description: 'Gestión de sorteos y tickets para clientes' },
  { key: 'advancedReportsEnabled', label: 'Reportes avanzados', description: 'Pestañas de Caja, Productos y Clientes en reportes' },
];

function ModuleToggleRow({ def, value, disabled, onChange }: {
  def: ModuleDef; value: boolean; disabled: boolean;
  onChange: (key: keyof TenantModules, value: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between py-2.5 px-3 rounded-xl hover:bg-[var(--color-surface-2)] transition-colors">
      <div className="min-w-0 pr-4">
        <p className="text-sm font-semibold text-gray-700">{def.label}</p>
        <p className="text-xs text-gray-500 mt-0.5">{def.description}</p>
      </div>
      <button
        onClick={() => onChange(def.key, !value)}
        disabled={disabled}
        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed ${value ? 'bg-primary-500' : 'bg-[var(--border-strong)]'}`}
        role="switch" aria-checked={value}
      >
        <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform duration-200 ${value ? 'translate-x-4' : 'translate-x-0'}`} />
      </button>
    </div>
  );
}

interface TenantPanelProps {
  tenant: TenantRow;
  plans: PlanDto[];
  onPlanUpdate: (id: string, plan: SaasPlan) => void;
  onModulesUpdate: (id: string, modules: TenantModules) => void;
}

export function TenantPanel({ tenant, plans, onPlanUpdate, onModulesUpdate }: TenantPanelProps) {
  const [modules, setModules] = useState<TenantModules>(tenant.modules);
  const [savingModule, setSavingModule] = useState<keyof TenantModules | null>(null);
  const [savingPlan, setSavingPlan] = useState(false);
  const [planExcess, setPlanExcess] = useState<PlanExcess[]>([]);
  const [showResetPw, setShowResetPw] = useState(false);
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [resettingPw, setResettingPw] = useState(false);

  useEffect(() => { setModules(tenant.modules); }, [tenant.modules]);

  const activePlan = plans.find((p) => p.id === tenant.plan);

  const handlePlanChange = async (plan: SaasPlan) => {
    setSavingPlan(true);
    try {
      const result: TenantPlanUpdateResponse = await adminApi.updateTenantPlan(tenant.id, plan);
      onPlanUpdate(tenant.id, plan);
      onModulesUpdate(tenant.id, {
        ordersEnabled:   result.ordersEnabled,
        cashEnabled:     result.cashEnabled,
        teamEnabled:     result.teamEnabled,
        branchesEnabled: result.branchesEnabled,
        kitchenEnabled:  result.kitchenEnabled,
        rafflesEnabled:  result.rafflesEnabled,
        advancedReportsEnabled: result.advancedReportsEnabled,
      });
      // Nada se desactiva solo: bajar de plan conserva los datos del cliente y
      // acá se avisa qué quedó por encima, para que el admin decida.
      setPlanExcess(result.excess ?? []);
    } finally {
      setSavingPlan(false);
    }
  };

  const handleResetOwnerPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenant.owner) return;
    if (newPw !== confirmPw) {
      toast.error('Las contraseñas no coinciden');
      return;
    }
    setResettingPw(true);
    try {
      await adminApi.resetUserPassword(tenant.owner.id, newPw);
      toast.success(`Contraseña del owner reseteada`);
      setShowResetPw(false);
      setNewPw('');
      setConfirmPw('');
    } catch {
      toast.error('Error al resetear contraseña');
    } finally {
      setResettingPw(false);
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
    <div className="border-t border-[var(--border-subtle)] animate-slide-down">
      <div className="grid md:grid-cols-2 divide-y divide-[var(--border-subtle)] md:divide-y-0 md:divide-x md:divide-[var(--border-subtle)]">

        {/* Plan selector */}
        <div className="p-5">
          <p className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-3">Plan SaaS</p>
          <div className="flex flex-col gap-2">
            {plans.map((p) => {
              const cfg = PLAN_CONFIG[p.id as SaasPlan];
              const isActive = tenant.plan === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => handlePlanChange(p.id as SaasPlan)}
                  disabled={savingPlan}
                  className={[
                    'flex items-center gap-3 px-3.5 py-2.5 rounded-xl border text-left transition-all',
                    isActive ? cfg.cardActive : 'border-[var(--border-subtle)] bg-[var(--color-surface-2)] hover:border-[var(--border-strong)] hover:bg-[var(--color-surface-3)]',
                    savingPlan ? 'opacity-50 cursor-not-allowed' : '',
                  ].join(' ')}
                >
                  <PlanBadge plan={p.id as SaasPlan} />
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-semibold text-gray-700">{p.displayName}</span>
                    <span className="text-xs text-gray-500 ml-2">Bs {p.priceBs}/mes</span>
                  </div>
                  <span className="text-xs text-gray-500 shrink-0 hidden sm:block">
                    {limitLabel(p.maxBranches)} suc · {limitLabel(p.maxCashiers)} caj
                  </span>
                  {isActive && (
                    <svg className="w-4 h-4 text-primary-400 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>
              );
            })}
          </div>

          {activePlan && (
            <div className="mt-3 flex gap-2">
              <div className={`flex-1 rounded-xl px-3 py-2.5 text-center ${tenant.branchCount >= activePlan.maxBranches && !isUnlimited(activePlan.maxBranches) ? 'bg-red-500/12 text-red-400' : 'bg-[var(--color-surface-2)] text-gray-600'}`}>
                <p className="font-bold text-base leading-none">
                  {tenant.branchCount}<span className="font-normal text-xs opacity-60">/{limitLabel(activePlan.maxBranches)}</span>
                </p>
                <p className="text-[11px] opacity-60 mt-1">Sucursales</p>
              </div>
              <div className={`flex-1 rounded-xl px-3 py-2.5 text-center ${tenant.cashierCount >= activePlan.maxCashiers && !isUnlimited(activePlan.maxCashiers) ? 'bg-red-500/12 text-red-400' : 'bg-[var(--color-surface-2)] text-gray-600'}`}>
                <p className="font-bold text-base leading-none">
                  {tenant.cashierCount}<span className="font-normal text-xs opacity-60">/{limitLabel(activePlan.maxCashiers)}</span>
                </p>
                <p className="text-[11px] opacity-60 mt-1">Cajeros</p>
              </div>
              <div className={`flex-1 rounded-xl px-3 py-2.5 text-center ${tenant.productCount >= activePlan.maxProducts && !isUnlimited(activePlan.maxProducts) ? 'bg-red-500/12 text-red-400' : 'bg-[var(--color-surface-2)] text-gray-600'}`}>
                <p className="font-bold text-base leading-none">
                  {tenant.productCount}<span className="font-normal text-xs opacity-60">/{limitLabel(activePlan.maxProducts)}</span>
                </p>
                <p className="text-[11px] opacity-60 mt-1">Productos</p>
              </div>
            </div>
          )}

          {activePlan && (
            <p className="mt-2 text-center text-[11px] text-gray-500">
              Historial de reportes: {limitLabel(activePlan.reportHistoryDays)} días · Imágenes: {limitLabel(activePlan.maxStorageMb)} MB
            </p>
          )}

          {planExcess.length > 0 && (
            <div className="mt-3 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3.5 py-2.5">
              <p className="text-xs font-semibold text-amber-700 dark:text-amber-400">
                Este negocio quedó por encima de su plan nuevo
              </p>
              <ul className="mt-1.5 space-y-0.5">
                {planExcess.map((e) => (
                  <li key={e.resource} className="text-xs text-amber-700 dark:text-amber-400">
                    · Tiene {e.current} {e.resource} y el plan permite {e.max}
                  </li>
                ))}
              </ul>
              <p className="mt-1.5 text-[11px] text-amber-700/80 dark:text-amber-400/80">
                No se desactivó nada: conserva sus datos y no podrá crear más hasta volver al límite.
              </p>
            </div>
          )}

          {tenant.owner && (
            <div className="mt-4 border-t border-[var(--border-subtle)] pt-4">
              <p className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-2">Acceso del owner</p>
              {!showResetPw ? (
                <button
                  onClick={() => setShowResetPw(true)}
                  className="w-full text-left text-xs font-medium px-3 py-2.5 rounded-xl bg-amber-500/10 text-amber-600 border border-amber-500/20 hover:bg-amber-500/15 transition-colors"
                >
                  Resetear contraseña de {tenant.owner.name}
                </button>
              ) : (
                <form onSubmit={handleResetOwnerPassword} className="space-y-2">
                  <input
                    type="password"
                    placeholder="Nueva contraseña (mín. 6 caracteres)"
                    value={newPw}
                    onChange={(e) => setNewPw(e.target.value)}
                    minLength={6}
                    required
                    className="w-full text-sm border border-[var(--border-subtle)] rounded-xl px-3 py-2 bg-[var(--color-surface-2)] text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500/50 transition-colors"
                  />
                  <input
                    type="password"
                    placeholder="Confirmar contraseña"
                    value={confirmPw}
                    onChange={(e) => setConfirmPw(e.target.value)}
                    minLength={6}
                    required
                    className="w-full text-sm border border-[var(--border-subtle)] rounded-xl px-3 py-2 bg-[var(--color-surface-2)] text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500/50 transition-colors"
                  />
                  <div className="flex gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => { setShowResetPw(false); setNewPw(''); setConfirmPw(''); }}
                      className="flex-1 text-xs font-medium px-3 py-2 rounded-xl border border-[var(--border-subtle)] text-gray-500 hover:bg-[var(--color-surface-2)] transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={resettingPw}
                      className="flex-1 text-xs font-semibold px-3 py-2 rounded-xl bg-amber-500 text-white hover:bg-amber-400 disabled:opacity-50 transition-colors"
                    >
                      {resettingPw ? 'Guardando…' : 'Confirmar reset'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>

        {/* Module overrides */}
        <div className="p-5 bg-[var(--color-surface-2)]">
          <p className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-2 px-3">Módulos activos</p>
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
    </div>
  );
}
