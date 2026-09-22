import { useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import type { ExpenseConceptDto } from '@pos/shared';
import { expensesApi } from '../../api/expenses.api';
import { useExpenseConcepts } from '../../hooks/useExpenses';
import { useAuth } from '../../context/auth.context';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Icon } from '../ui/Icon';
import { FIELD } from './ExpenseField';
import { NewConceptModal } from './NewConceptModal';
import { handleApiError } from '../../utils/api-error';
import { today } from '../../utils/date';

interface QuickExpensePanelProps {
  /** Se llama tras registrar un gasto para refrescar la lista del período. */
  onRegistered: () => void;
  /** Abre el configurador de la lista de gastos. */
  onManage: () => void;
}

/**
 * Única vía de registro de gastos: un gasto primero existe en la lista y
 * desde ahí se registra. Si no está, se agrega y se registra en un solo flujo.
 */
export function QuickExpensePanel({ onRegistered, onManage }: QuickExpensePanelProps) {
  const { concepts, loading } = useExpenseConcepts();
  const [query, setQuery]       = useState('');
  const [category, setCategory] = useState('');
  const [active, setActive]     = useState<ExpenseConceptDto | null>(null);
  const [creatingName, setCreatingName] = useState<string | null>(null);

  const categories = useMemo(() => {
    const names = new Set(concepts.map((c) => c.categoryName).filter(Boolean));
    return [...names].sort((a, b) => a.localeCompare(b, 'es'));
  }, [concepts]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return concepts.filter((c) => {
      const matchesCategory = !category || c.categoryName === category;
      const matchesQuery =
        !q || c.name.toLowerCase().includes(q) || c.categoryName.toLowerCase().includes(q);
      return matchesCategory && matchesQuery;
    });
  }, [concepts, query, category]);

  return (
    <section className="mb-5 overflow-hidden rounded-2xl border border-[var(--border-subtle)] shadow-card-md" style={{ background: 'var(--color-surface-card)' }}>
      <div className="flex flex-col gap-3 border-b border-[var(--border-subtle)] px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <div>
          <h2 className="font-heading text-sm font-black text-gray-900">Registrar gasto</h2>
          <p className="text-xs text-gray-500">Toca el gasto y escribe el monto.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:w-56 sm:flex-none">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              <Icon name="search" size={14} />
            </span>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar gasto…"
              className={`${FIELD} pl-8`}
            />
          </div>
          <button
            type="button"
            onClick={onManage}
            title="Configurar la lista de gastos"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[var(--border-subtle)] text-gray-500 transition-colors hover:border-primary-500/40 hover:text-primary-600"
          >
            <Icon name="settings" size={16} />
          </button>
        </div>
      </div>

      {categories.length > 0 && (
        <div className="flex gap-1.5 overflow-x-auto border-b border-[var(--border-subtle)] px-4 py-2.5 sm:px-5">
          <CategoryChip label="Todos" active={category === ''} onClick={() => setCategory('')} />
          {categories.map((name) => (
            <CategoryChip
              key={name}
              label={name}
              active={category === name}
              onClick={() => setCategory(category === name ? '' : name)}
            />
          ))}
        </div>
      )}

      <div className="p-4 sm:p-5">
        {loading ? (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="h-16 animate-pulse rounded-xl bg-[var(--color-surface-2)]" />
            ))}
          </div>
        ) : visible.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-8 text-center">
            <Icon name="box" size={28} strokeWidth={1.5} className="text-gray-300" />
            <div>
              <p className="text-sm font-semibold text-gray-600">
                {concepts.length === 0
                  ? 'Todavía no tienes gastos en tu lista'
                  : query.trim()
                  ? `"${query.trim()}" no está en tu lista`
                  : 'Ningún gasto coincide'}
              </p>
              <p className="mt-1 text-xs text-gray-400">
                Agrégalo a la lista y lo registras enseguida.
              </p>
            </div>
            <Button size="sm" onClick={() => setCreatingName(query.trim())}>
              <span className="flex items-center gap-1.5">
                <Icon name="plus" size={14} strokeWidth={2.2} />
                {query.trim() ? `Agregar "${query.trim()}"` : 'Agregar gasto'}
              </span>
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
            {visible.map((concept) => (
              <button
                key={concept.id}
                type="button"
                onClick={() => setActive(concept)}
                className="group flex min-h-16 flex-col items-start justify-between gap-1 rounded-xl border border-[var(--border-subtle)] bg-[var(--color-surface-2)] px-3 py-2.5 text-left transition-all hover:-translate-y-0.5 hover:border-primary-500/50 hover:bg-[var(--color-surface-card)] hover:shadow-card-md"
              >
                <span className="line-clamp-2 text-sm font-bold leading-tight text-gray-800 group-hover:text-gray-900">
                  {concept.name}
                </span>
                <span className="flex w-full items-center justify-between gap-1">
                  <span className="truncate text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                    {concept.categoryName}
                  </span>
                  {concept.unit && (
                    <span className="shrink-0 rounded-md bg-[var(--color-surface-3)] px-1.5 py-0.5 text-[10px] font-bold text-gray-500">
                      {concept.unit}
                    </span>
                  )}
                </span>
              </button>
            ))}

            <button
              type="button"
              onClick={() => setCreatingName('')}
              className="flex min-h-16 flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-[var(--border-strong)] px-3 py-2.5 text-gray-400 transition-colors hover:border-primary-500/60 hover:text-primary-600"
            >
              <Icon name="plus" size={16} strokeWidth={2.2} />
              <span className="text-xs font-bold">Agregar gasto</span>
            </button>
          </div>
        )}
      </div>

      {active && (
        <QuickExpenseDialog
          concept={active}
          onClose={() => setActive(null)}
          onSaved={() => { setActive(null); onRegistered(); }}
        />
      )}

      <NewConceptModal
        isOpen={creatingName !== null}
        initialName={creatingName ?? ''}
        onClose={() => setCreatingName(null)}
        onCreated={(concept) => {
          setCreatingName(null);
          setQuery('');
          // Encadena directo al registro: para eso lo estaba agregando.
          setActive(concept);
        }}
      />
    </section>
  );
}

function CategoryChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-bold transition-colors ${
        active
          ? 'bg-primary-600 text-white'
          : 'bg-[var(--color-surface-2)] text-gray-500 hover:text-gray-700'
      }`}
    >
      {label}
    </button>
  );
}

/** Diálogo compacto: cantidad/precio (o monto) y listo. */
function QuickExpenseDialog({
  concept, onClose, onSaved,
}: {
  concept: ExpenseConceptDto;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { currentBranchId } = useAuth();
  const tracksQuantity = !!concept.unit;

  const [quantity, setQuantity]   = useState('1');
  const [price, setPrice]         = useState(concept.defaultUnitPrice ? String(concept.defaultUnitPrice) : '');
  const [expenseDate, setDate]    = useState(today());
  const [showDate, setShowDate]   = useState(false);
  const [saving, setSaving]       = useState(false);

  const qty   = parseFloat(quantity) || 0;
  const unit  = parseFloat(price)    || 0;
  const total = Math.round(qty * unit * 100) / 100;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (qty <= 0)  { toast.error('La cantidad debe ser mayor a 0'); return; }
    if (unit <= 0) { toast.error('El monto debe ser mayor a 0');    return; }
    // Un gasto siempre pertenece a una sucursal: en la vista consolidada no hay
    // ninguna a la que imputarlo.
    if (!currentBranchId) {
      toast.error('Selecciona una sucursal antes de registrar un gasto');
      return;
    }

    setSaving(true);
    try {
      await expensesApi.create({
        items: [{
          conceptId:  concept.id,
          categoryId: concept.categoryId,
          name:       concept.name,
          unit:       concept.unit ?? undefined,
          quantity:   qty,
          unitPrice:  unit,
        }],
        expenseDate,
        branchId: currentBranchId ?? undefined,
      });
      toast.success(`${concept.name} · Bs ${total.toFixed(2)}`);
      onSaved();
    } catch (err) {
      handleApiError(err, 'Error al registrar el gasto');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen onClose={onClose} title={concept.name} size="sm">
      <form onSubmit={handleSubmit} className="space-y-4">
        <p className="-mt-1 text-xs font-semibold uppercase tracking-wider text-gray-400">
          {concept.categoryName}
        </p>

        {tracksQuantity ? (
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-gray-500">
                Cantidad ({concept.unit})
              </span>
              <input
                autoFocus
                type="number" inputMode="decimal" min="0.001" step="0.001"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className={`${FIELD} text-right tabular-nums`}
                required
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-gray-500">
                Precio por {concept.unit}
              </span>
              <input
                type="number" inputMode="decimal" min="0.01" step="0.01"
                placeholder="0.00"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className={`${FIELD} text-right tabular-nums`}
                required
              />
            </label>
          </div>
        ) : (
          <label className="block">
            <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-gray-500">Monto</span>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-gray-400">Bs</span>
              <input
                autoFocus
                type="number" inputMode="decimal" min="0.01" step="0.01"
                placeholder="0.00"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className={`${FIELD} text-right text-lg font-bold tabular-nums`}
                required
              />
            </div>
          </label>
        )}

        <div className="flex items-center justify-between rounded-xl border border-[var(--border-subtle)] bg-[var(--color-surface-2)] px-4 py-3">
          <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Total</span>
          <span className="font-heading text-xl font-black tabular-nums text-gray-900">
            Bs {total.toFixed(2)}
          </span>
        </div>

        {showDate ? (
          <label className="block">
            <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-gray-500">Fecha</span>
            <input type="date" value={expenseDate} onChange={(e) => setDate(e.target.value)} className={FIELD} required />
          </label>
        ) : (
          <button
            type="button"
            onClick={() => setShowDate(true)}
            className="flex w-full items-center justify-center gap-1.5 text-xs font-semibold text-gray-500 transition-colors hover:text-primary-600"
          >
            <Icon name="clock" size={13} />
            Hoy — cambiar fecha
          </button>
        )}

        <div className="flex gap-3 pt-1">
          <Button type="button" variant="secondary" fullWidth onClick={onClose}>Cancelar</Button>
          <Button type="submit" fullWidth loading={saving}>Registrar</Button>
        </div>
      </form>
    </Modal>
  );
}
