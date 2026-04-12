import { useState } from 'react';
import { SaasPlan } from '@pos/shared';
import { adminApi, type PlanRow } from '../../api/admin.api';
import { PlanBadge, PLAN_CONFIG, limitLabel } from './PlanBadge';

const PLAN_ORDER: SaasPlan[] = [SaasPlan.BASICO, SaasPlan.PRO, SaasPlan.NEGOCIO];

interface PlansSectionProps {
  plans: PlanRow[];
  onUpdate: (updated: PlanRow) => void;
}

export function PlansSection({ plans, onUpdate }: PlansSectionProps) {
  const [editing, setEditing] = useState<SaasPlan | null>(null);
  const [form, setForm] = useState<Partial<PlanRow>>({});
  const [saving, setSaving] = useState(false);

  const startEdit = (p: PlanRow) => {
    setEditing(p.id);
    setForm({
      displayName: p.displayName,
      priceBs: p.priceBs,
      maxBranches: p.maxBranches,
      maxCashiers: p.maxCashiers,
      maxProducts: p.maxProducts,
      kitchenEnabled: p.kitchenEnabled,
    });
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

  const sortedPlans = PLAN_ORDER
    .map((id) => plans.find((p) => p.id === id))
    .filter(Boolean) as PlanRow[];

  return (
    <section className="mb-6">
      <div className="px-1 mb-3">
        <h2 className="font-heading font-bold text-sm text-gray-900">Planes SaaS</h2>
        <p className="text-xs text-gray-400 mt-0.5">Límites y precios por nivel</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {sortedPlans.map((p) => {
          const cfg = PLAN_CONFIG[p.id as SaasPlan];
          return (
            <div key={p.id} className={`rounded-2xl border ${cfg.card} overflow-hidden`}>
              {editing === p.id ? (
                <PlanEditForm
                  plan={p}
                  form={form}
                  saving={saving}
                  onFormChange={setForm}
                  onSave={() => handleSave(p.id as SaasPlan)}
                  onCancel={() => setEditing(null)}
                />
              ) : (
                <PlanViewCard plan={p} cfg={cfg} onEdit={() => startEdit(p)} />
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

// ─── Sub-components ───────────────────────────────────────────

const PLAN_FIELDS: [keyof PlanRow, string, string][] = [
  ['displayName',  'Nombre',                  'text'],
  ['priceBs',      'Precio (Bs)',              'number'],
  ['maxBranches',  'Máx sucursales (-1=∞)',    'number'],
  ['maxCashiers',  'Máx cajeros (-1=∞)',       'number'],
  ['maxProducts',  'Máx productos (-1=∞)',     'number'],
];

function PlanEditForm({ plan, form, saving, onFormChange, onSave, onCancel }: {
  plan: PlanRow;
  form: Partial<PlanRow>;
  saving: boolean;
  onFormChange: (updater: (prev: Partial<PlanRow>) => Partial<PlanRow>) => void;
  onSave: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="p-4 bg-white/70 space-y-3">
      <div className="flex items-center gap-2 mb-1">
        <PlanBadge plan={plan.id as SaasPlan} />
        <span className="text-xs text-gray-400">editando</span>
      </div>
      <div className="space-y-2">
        {PLAN_FIELDS.map(([field, label, type]) => (
          <div key={field}>
            <label className="block text-[11px] font-medium text-gray-500 mb-1">{label}</label>
            <input
              type={type}
              value={String(form[field] ?? '')}
              onChange={(e) => onFormChange((prev) => ({
                ...prev,
                [field]: type === 'number' ? Number(e.target.value) : e.target.value,
              }))}
              className="w-full text-sm border border-gray-200 rounded-lg px-2.5 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-primary-400/30"
            />
          </div>
        ))}
        <div className="flex items-center justify-between py-1.5">
          <label className="text-sm font-medium text-gray-700">Cocina</label>
          <button
            onClick={() => onFormChange((prev) => ({ ...prev, kitchenEnabled: !prev.kitchenEnabled }))}
            className={`relative inline-flex h-5 w-9 rounded-full border-2 border-transparent transition-colors ${form.kitchenEnabled ? 'bg-primary-500' : 'bg-gray-200'}`}
          >
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${form.kitchenEnabled ? 'translate-x-4' : 'translate-x-0'}`} />
          </button>
        </div>
      </div>
      <div className="flex gap-2 pt-1">
        <button onClick={onCancel} className="flex-1 text-sm text-gray-500 hover:text-gray-700 py-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50">
          Cancelar
        </button>
        <button
          onClick={onSave}
          disabled={saving}
          className="flex-1 text-sm font-semibold bg-primary-600 text-white py-1.5 rounded-lg hover:bg-primary-700 disabled:opacity-50"
        >
          {saving ? 'Guardando…' : 'Guardar'}
        </button>
      </div>
    </div>
  );
}

function PlanViewCard({ plan, cfg, onEdit }: {
  plan: PlanRow;
  cfg: typeof PLAN_CONFIG[SaasPlan];
  onEdit: () => void;
}) {
  return (
    <div className="p-4">
      <div className="flex items-start justify-between mb-3">
        <PlanBadge plan={plan.id as SaasPlan} />
        <button
          onClick={onEdit}
          className="text-[11px] font-medium text-gray-400 hover:text-gray-600 px-2 py-1 rounded-lg hover:bg-white/70 transition-colors"
        >
          Editar
        </button>
      </div>
      <div className="mb-3">
        <span className={`font-heading font-black text-2xl ${cfg.accent}`}>Bs {plan.priceBs}</span>
        <span className="text-xs text-gray-400 ml-1">/mes</span>
      </div>
      <div className="space-y-1.5">
        {([
          ['Sucursales', limitLabel(plan.maxBranches)],
          ['Cajeros',    limitLabel(plan.maxCashiers)],
          ['Productos',  limitLabel(plan.maxProducts)],
        ] as [string, string][]).map(([label, val]) => (
          <div key={label} className="flex justify-between text-xs">
            <span className="text-gray-400">{label}</span>
            <span className="font-semibold text-gray-700">{val}</span>
          </div>
        ))}
        <div className="flex justify-between text-xs">
          <span className="text-gray-400">Cocina</span>
          <span className={`font-semibold ${plan.kitchenEnabled ? 'text-emerald-600' : 'text-gray-300'}`}>
            {plan.kitchenEnabled ? 'Sí' : 'No'}
          </span>
        </div>
      </div>
    </div>
  );
}
