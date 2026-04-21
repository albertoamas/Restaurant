import { useState, useEffect } from 'react';
import { SaasPlan } from '@pos/shared';
import { adminApi, type TenantRow, type TenantModules, type PlanDto, type TenantPlanUpdateResponse } from '../../api/admin.api';
import { PlanBadge, PLAN_CONFIG, limitLabel } from './PlanBadge';

interface ModuleDef { key: keyof TenantModules; label: string; description: string; }

const MODULE_DEFS: ModuleDef[] = [
  { key: 'ordersEnabled',   label: 'Pedidos',   description: 'Seguimiento y estados de órdenes' },
  { key: 'cashEnabled',     label: 'Caja',       description: 'Apertura y cierre de turno con control de efectivo' },
  { key: 'teamEnabled',     label: 'Equipo',     description: 'Gestión de cajeros y sus sucursales asignadas' },
  { key: 'branchesEnabled', label: 'Sucursales', description: 'Administración de múltiples locales' },
  { key: 'kitchenEnabled',  label: 'Cocina',     description: 'Panel de visualización de pedidos en cocina' },
  { key: 'rafflesEnabled',  label: 'Sorteos',    description: 'Gestión de sorteos y tickets para clientes' },
];

function ModuleToggleRow({ def, value, disabled, onChange }: {
  def: ModuleDef; value: boolean; disabled: boolean;
  onChange: (key: keyof TenantModules, value: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between py-2.5 px-3 rounded-xl hover:bg-white/70 transition-colors">
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
      });
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
    <div className="border-t border-gray-100 animate-slide-down">
      <div className="grid md:grid-cols-2 divide-y divide-gray-100 md:divide-y-0 md:divide-x">

        {/* Plan selector */}
        <div className="p-5">
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3">Plan SaaS</p>
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
                    isActive ? cfg.cardActive : 'border-gray-200 bg-white/60 hover:border-gray-300 hover:bg-white/80',
                    savingPlan ? 'opacity-50 cursor-not-allowed' : '',
                  ].join(' ')}
                >
                  <PlanBadge plan={p.id as SaasPlan} />
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-semibold text-gray-900">{p.displayName}</span>
                    <span className="text-xs text-gray-400 ml-2">Bs {p.priceBs}/mes</span>
                  </div>
                  <span className="text-xs text-gray-400 shrink-0 hidden sm:block">
                    {limitLabel(p.maxBranches)} suc · {limitLabel(p.maxCashiers)} caj
                  </span>
                  {isActive && (
                    <svg className="w-4 h-4 text-primary-500 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>
              );
            })}
          </div>

          {activePlan && (
            <div className="mt-3 flex gap-2">
              <div className={`flex-1 rounded-xl px-3 py-2.5 text-center ${tenant.branchCount >= activePlan.maxBranches && activePlan.maxBranches !== -1 ? 'bg-red-50 text-red-600' : 'bg-gray-50 text-gray-600'}`}>
                <p className="font-bold text-base leading-none">
                  {tenant.branchCount}<span className="font-normal text-xs opacity-60">/{limitLabel(activePlan.maxBranches)}</span>
                </p>
                <p className="text-[11px] opacity-60 mt-1">Sucursales</p>
              </div>
              <div className={`flex-1 rounded-xl px-3 py-2.5 text-center ${tenant.cashierCount >= activePlan.maxCashiers && activePlan.maxCashiers !== -1 ? 'bg-red-50 text-red-600' : 'bg-gray-50 text-gray-600'}`}>
                <p className="font-bold text-base leading-none">
                  {tenant.cashierCount}<span className="font-normal text-xs opacity-60">/{limitLabel(activePlan.maxCashiers)}</span>
                </p>
                <p className="text-[11px] opacity-60 mt-1">Cajeros</p>
              </div>
            </div>
          )}
        </div>

        {/* Module overrides */}
        <div className="p-5 bg-gray-50/40">
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2 px-3">Módulos activos</p>
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
