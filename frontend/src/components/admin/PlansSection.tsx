import { useId, useState } from 'react';
import toast from 'react-hot-toast';
import { SaasPlan, isUnlimited } from '@pos/shared';
import { adminApi, type PlanDto } from '../../api/admin.api';
import { Button } from '../ui/Button';
import { Icon } from '../ui/Icon';
import { Input } from '../ui/Input';
import { Modal } from '../ui/Modal';
import { Toggle } from '../ui/Toggle';
import { PLAN_ORDER, PlanBadge, limitLabel, storageLabel } from './PlanBadge';
import { handleApiError } from '../../utils/api-error';

type LimitField = 'maxBranches' | 'maxCashiers' | 'maxProducts' | 'reportHistoryDays' | 'maxStorageMb';
type FlagField = 'kitchenEnabled' | 'rafflesEnabled' | 'advancedReports';

const LIMITS: { field: LimitField; label: string; unit?: string }[] = [
  { field: 'maxBranches',       label: 'Sucursales' },
  { field: 'maxCashiers',       label: 'Cajeros' },
  { field: 'maxProducts',       label: 'Productos' },
  { field: 'reportHistoryDays', label: 'Historial de reportes', unit: 'días' },
  { field: 'maxStorageMb',      label: 'Espacio para fotos', unit: 'MB' },
];

/** Equipo no está: se deriva de `maxCashiers` (el número de cajeros ya es su interruptor). */
const FLAGS: { field: FlagField; label: string }[] = [
  { field: 'kitchenEnabled',  label: 'Cocina' },
  { field: 'rafflesEnabled',  label: 'Sorteos' },
  { field: 'advancedReports', label: 'Reportes avanzados' },
];

/** Un límite: número o "Sin límite" (-1). Antes había que escribir -1 a mano. */
function LimitInput({ label, unit, value, onChange }: { label: string; unit?: string; value: number; onChange: (v: number) => void }) {
  const unlimited = isUnlimited(value);
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3">
      <span className="min-w-0 flex-1 text-body font-semibold text-main">{label}</span>
      {unlimited ? (
        <span className="text-label text-soft">Sin límite</span>
      ) : (
        <div className="w-36">
          <Input
            aria-label={label}
            inputSize="sm"
            type="number" inputMode="numeric" min={1} step={1}
            value={String(value)}
            onChange={(e) => onChange(Math.floor(Number(e.target.value)))}
            rightAddon={unit ? <span className="pr-3 text-label text-muted">{unit}</span> : undefined}
          />
        </div>
      )}
      <span className="inline-flex items-center gap-2 text-caption text-soft">
        Sin límite
        <Toggle checked={unlimited} onChange={() => onChange(unlimited ? 1 : -1)} label={`${label} sin límite`} />
      </span>
    </div>
  );
}

function PlanFormModal({ plan, onClose, onSaved }: { plan: PlanDto; onClose: () => void; onSaved: (p: PlanDto) => void }) {
  const formId = useId();
  const [form, setForm] = useState<PlanDto>(plan);
  const [saving, setSaving] = useState(false);
  const set = <K extends keyof PlanDto>(key: K, value: PlanDto[K]) => setForm((prev) => ({ ...prev, [key]: value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { id: _id, ...updates } = form;
      const updated = await adminApi.updatePlan(plan.id as SaasPlan, updates);
      onSaved(updated);
      toast.success(`Plan ${updated.displayName} actualizado`);
      onClose();
    } catch (err) {
      // El backend rechaza límites en 0 o incoherentes entre planes.
      handleApiError(err, 'No se pudo guardar el plan');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={`Editar plan ${plan.displayName}`}
      size="md"
      footer={
        <div className="flex gap-3">
          <Button type="button" variant="secondary" fullWidth onClick={onClose} disabled={saving}>Cancelar</Button>
          <Button type="submit" form={formId} fullWidth loading={saving}>Guardar plan</Button>
        </div>
      }
    >
      <form id={formId} onSubmit={submit} className="space-y-5">
        <p className="text-label text-soft">Los cambios valen para todos los negocios con este plan desde ahora.</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <Input label="Nombre" value={form.displayName} onChange={(e) => set('displayName', e.target.value)} maxLength={40} />
          <Input label="Precio al mes" type="number" inputMode="numeric" min={0} leftAddon="Bs"
            value={String(form.priceBs)} onChange={(e) => set('priceBs', Number(e.target.value))} />
        </div>
        <div>
          <p className="mb-2 text-label font-semibold text-soft">Límites</p>
          <div className="overflow-hidden rounded-card border border-line divide-y divide-line">
            {LIMITS.map((l) => (
              <LimitInput key={l.field} label={l.label} unit={l.unit} value={form[l.field]} onChange={(v) => set(l.field, v)} />
            ))}
          </div>
        </div>
        <div>
          <p className="mb-2 text-label font-semibold text-soft">Módulos que incluye</p>
          <ul className="overflow-hidden rounded-card border border-line divide-y divide-line">
            {FLAGS.map((f) => (
              <li key={f.field} className="flex items-center justify-between gap-3 px-4 py-3">
                <span className="text-body text-main">{f.label}</span>
                <Toggle checked={form[f.field]} onChange={() => set(f.field, !form[f.field])} label={f.label} />
              </li>
            ))}
          </ul>
          <p className="mt-2 text-caption text-muted">Equipo y Sucursales dependen del número de cajeros y sucursales.</p>
        </div>
      </form>
    </Modal>
  );
}

/** Planes a la venta: precio, límites y módulos. "Editar" abre el formulario. */
export function PlansSection({ plans, onUpdate }: { plans: PlanDto[]; onUpdate: (updated: PlanDto) => void }) {
  const [editing, setEditing] = useState<PlanDto | null>(null);
  const sorted = PLAN_ORDER.map((id) => plans.find((p) => p.id === id)).filter((p): p is PlanDto => !!p);

  return (
    <>
      <div className="grid gap-4 md:grid-cols-3">
        {sorted.map((p) => (
          <article key={p.id} className="flex flex-col rounded-card border border-line bg-surface-card p-5 shadow-raised">
            <div className="flex items-center justify-between gap-2">
              <PlanBadge plan={p.id as SaasPlan} />
              <Button variant="ghost" size="sm" onClick={() => setEditing(p)}>
                <Icon name="edit" size={16} />
                Editar
              </Button>
            </div>
            <p className="mt-3 flex items-baseline gap-1.5">
              <span className="font-heading text-[32px] font-bold leading-none text-main tabular-nums">{p.priceBs}</span>
              <span className="text-label text-soft">Bs al mes</span>
            </p>
            <dl className="mt-4 divide-y divide-line border-t border-line text-label">
              {LIMITS.map((l) => (
                <div key={l.field} className="flex justify-between gap-3 py-1.5">
                  <dt className="text-soft">{l.label}</dt>
                  <dd className="font-semibold text-main tabular-nums">
                    {l.field === 'maxStorageMb'
                      ? storageLabel(p[l.field])
                      : `${limitLabel(p[l.field])}${!isUnlimited(p[l.field]) && l.unit ? ` ${l.unit}` : ''}`}
                  </dd>
                </div>
              ))}
              {FLAGS.map((f) => (
                <div key={f.field} className="flex justify-between gap-3 py-1.5">
                  <dt className="text-soft">{f.label}</dt>
                  <dd className={`font-semibold ${p[f.field] ? 'text-emerald-700 dark:text-emerald-400' : 'text-muted'}`}>{p[f.field] ? 'Sí' : 'No'}</dd>
                </div>
              ))}
            </dl>
          </article>
        ))}
      </div>
      {editing && <PlanFormModal plan={editing} onClose={() => setEditing(null)} onSaved={onUpdate} />}
    </>
  );
}
