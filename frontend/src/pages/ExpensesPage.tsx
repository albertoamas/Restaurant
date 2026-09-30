import { useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { UserRole } from '@pos/shared';
import type { ExpenseConceptDto, ExpenseDto } from '@pos/shared';
import { expensesApi } from '../api/expenses.api';
import { useExpenses } from '../hooks/useExpenses';
import { useAuth } from '../context/auth.context';
import { useBranchNames } from '../hooks/useBranches';
import { Button } from '../components/ui/Button';
import { ConfirmModal } from '../components/ui/ConfirmModal';
import { EmptyState } from '../components/ui/EmptyState';
import { Icon } from '../components/ui/Icon';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { PageHeader } from '../components/ui/PageHeader';
import { PageShell } from '../components/ui/PageShell';
import { SegmentedControl } from '../components/ui/SegmentedControl';
import { Skeleton } from '../components/ui/Skeleton';
import { Kpi } from '../components/report';
import { PickBranch } from '../components/branch/PickBranch';
import { ExpenseEditModal } from '../components/expenses/ExpenseEditModal';
import { ExpenseConceptsModal } from '../components/expenses/ExpenseConceptsModal';
import { ExpensePicker } from '../components/expenses/ExpensePicker';
import { QuickExpenseDialog } from '../components/expenses/QuickExpenseDialog';
import { NewConceptModal } from '../components/expenses/NewConceptModal';
import { ExpenseBrowser, type ExpenseView } from '../components/expenses/ExpenseBrowser';
import { ExpenseCalendar } from '../components/expenses/ExpenseCalendar';
import { ExpenseList } from '../components/expenses/ExpenseList';
import { expenseCategoryLabel } from '../utils/expense-labels';
import { handleApiError } from '../utils/api-error';
import { formatDayRange, mondayOf, today } from '../utils/date';
import { getBoliviaDayBounds, toBoliviaDateString } from '../utils/timezone';

type Period = 'today' | 'week' | 'month' | 'custom';

/** Último día del mes de un día `YYYY-MM-DD`. */
function lastDayOfMonth(day: string): string {
  const [y, m] = day.split('-').map(Number);
  return new Date(Date.UTC(y, m, 0)).toISOString().slice(0, 10);
}

/** Días del período en hora de Bolivia (no la del dispositivo). "Este mes" es el mes completo. */
function getRange(period: Period, customFrom: string, customTo: string): { from: string; to: string } {
  const t = today();
  if (period === 'today') return { from: t, to: t };
  if (period === 'week')  return { from: mondayOf(t), to: t };
  if (period === 'month') return { from: `${t.slice(0, 7)}-01`, to: lastDayOfMonth(t) };
  return { from: customFrom, to: customTo };
}

const PERIODS: { value: Period; label: string }[] = [
  { value: 'today',  label: 'Hoy' },
  { value: 'week',   label: 'Esta semana' },
  { value: 'month',  label: 'Este mes' },
  { value: 'custom', label: 'Rango' },
];

const bs = (n: number) => `Bs ${n.toFixed(2)}`;

export function ExpensesPage() {
  const { currentBranchId, user } = useAuth();
  const { branchName } = useBranchNames();
  const [period, setPeriod]         = useState<Period>('month');
  const [customFrom, setCustomFrom] = useState(today);
  const [customTo, setCustomTo]     = useState(today);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [view, setView]               = useState<ExpenseView>('activity');
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  // Registro: hoja con la lista (celular y tablet), gasto elegido y alta de uno nuevo.
  const [pickerOpen, setPickerOpen]     = useState(false);
  const [active, setActive]             = useState<ExpenseConceptDto | null>(null);
  const [creatingName, setCreatingName] = useState<string | null>(null);
  const [showConcepts, setConcepts]     = useState(false);

  const [editingExpense, setEditingExpense] = useState<ExpenseDto | null>(null);
  const [voiding, setVoiding]               = useState<ExpenseDto | null>(null);
  const [voidBusy, setVoidBusy]             = useState(false);

  const { from, to } = getRange(period, customFrom, customTo);
  const isOwner = user?.role === UserRole.OWNER;
  const branchParam = isOwner ? (currentBranchId ?? undefined) : undefined;
  // Un gasto siempre es de una sucursal: en la vista consolidada primero se elige una.
  const canRegister = !isOwner || currentBranchId !== null;
  const scope = currentBranchId ? `Sucursal ${branchName(currentBranchId) ?? 'elegida'}` : 'Todas las sucursales';

  const { start: utcFrom } = getBoliviaDayBounds(from);
  const { end:   utcTo   } = getBoliviaDayBounds(to);
  const { expenses, summary, loading, reload } = useExpenses(utcFrom, utcTo, branchParam);

  const summaryCategories = useMemo(
    () => Object.entries(summary.byCategory).filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]),
    [summary.byCategory],
  );
  const topCategory = summaryCategories[0];

  const filteredExpenses = useMemo(() => expenses.filter((expense) => {
    const matchesCategory = !selectedCategory || expense.items.some((item) =>
      (item.categoryName ?? expenseCategoryLabel(expense)) === selectedCategory,
    );
    const matchesDay = !selectedDay || toBoliviaDateString(new Date(expense.expenseDate)) === selectedDay;
    return matchesCategory && matchesDay;
  }), [expenses, selectedCategory, selectedDay]);

  const pick = (concept: ExpenseConceptDto) => { setPickerOpen(false); setActive(concept); };
  const add  = (name: string) => { setPickerOpen(false); setCreatingName(name); };
  const manage = () => { setPickerOpen(false); setConcepts(true); };

  const handleVoid = async () => {
    if (!voiding) return;
    setVoidBusy(true);
    try {
      await expensesApi.void(voiding.id);
      toast.success('Gasto anulado. El registro se conserva en el historial.');
      setVoiding(null);
      reload();
    } catch (err) {
      handleApiError(err, 'Error al anular el gasto');
    } finally {
      setVoidBusy(false);
    }
  };

  const register = canRegister
    ? <ExpensePicker onPick={pick} onAdd={add} onManage={manage} />
    : <PickBranch description="Cada gasto se registra en una sucursal." />;

  return (
    <PageShell>
      <PageHeader
        title="Gastos"
        description={`${formatDayRange(from, to)}. ${scope}.`}
        actions={
          <Button className="xl:hidden" onClick={() => setPickerOpen(true)}>
            <Icon name="plus" size={18} />
            Registrar gasto
          </Button>
        }
      >
        <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-end gap-3">
          <SegmentedControl label="Período" wrap value={period} onChange={(p) => { setPeriod(p); setSelectedDay(null); }} options={PERIODS} />
          {period === 'custom' && (
            <div className="grid grid-cols-2 gap-3 sm:w-80">
              <Input type="date" label="Desde" value={customFrom} max={customTo} onChange={(e) => setCustomFrom(e.target.value)} />
              <Input type="date" label="Hasta" value={customTo} min={customFrom} onChange={(e) => setCustomTo(e.target.value)} />
            </div>
          )}
        </div>
      </PageHeader>

      <div className="mb-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="max-sm:col-span-2"><Kpi label="Total gastado" value={bs(summary.total)} /></div>
        <Kpi label="Movimientos" value={String(summary.transactionCount)} />
        <Kpi
          label="Categoría con más gasto"
          value={topCategory ? topCategory[0] : '-'}
          sub={topCategory ? `${bs(topCategory[1])}, ${Math.round((topCategory[1] / summary.total) * 100)}% del total` : undefined}
        />
      </div>

      {/* Escritorio: registrar a la izquierda (fijo al bajar) y movimientos a la derecha. */}
      <div className="xl:grid xl:grid-cols-[380px_minmax(0,1fr)] xl:items-start xl:gap-4">
        <aside className="hidden xl:block xl:sticky xl:top-4 xl:max-h-[calc(100dvh-6rem)] xl:overflow-y-auto rounded-card border border-line bg-surface-card shadow-raised p-4">
          <h2 className="mb-3 text-heading font-semibold text-main">Registrar gasto</h2>
          {register}
        </aside>

        <ExpenseBrowser
          categories={summaryCategories}
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
          view={view}
          onChangeView={setView}
          selectedDay={selectedDay}
          onClearDay={() => setSelectedDay(null)}
        >
          {view === 'calendar' ? (
            <ExpenseCalendar
              from={from}
              to={to}
              byDay={summary.byDay}
              selectedDay={selectedDay}
              onSelect={(day) => { setSelectedDay(day === selectedDay ? null : day); setView('activity'); }}
            />
          ) : loading ? (
            <div className="space-y-3 p-4 sm:p-5"><Skeleton variant="card" /><Skeleton variant="card" /></div>
          ) : filteredExpenses.length === 0 ? (
            <EmptyState
              compact
              icon="receipt"
              title={expenses.length === 0 ? 'Sin gastos en este período' : 'Ningún gasto con este filtro'}
              description={expenses.length === 0 ? 'Registra el primero con "Registrar gasto".' : 'Quita el filtro de categoría o de día para ver el resto.'}
            />
          ) : (
            <ExpenseList expenses={filteredExpenses} onEdit={setEditingExpense} onVoid={setVoiding} />
          )}
        </ExpenseBrowser>
      </div>

      {/* Celular y tablet: la lista para registrar en una hoja. */}
      <Modal isOpen={pickerOpen} onClose={() => setPickerOpen(false)} title="Registrar gasto" size="lg">
        {register}
      </Modal>

      {active && (
        <QuickExpenseDialog
          concept={active}
          onClose={() => setActive(null)}
          onSaved={() => { setActive(null); reload(); }}
        />
      )}

      <NewConceptModal
        isOpen={creatingName !== null}
        initialName={creatingName ?? ''}
        onClose={() => setCreatingName(null)}
        // Encadena directo al registro: para eso lo estaba agregando.
        onCreated={(concept) => { setCreatingName(null); setActive(concept); }}
      />

      <ExpenseEditModal expense={editingExpense} onClose={() => setEditingExpense(null)} onSaved={reload} />
      <ExpenseConceptsModal isOpen={showConcepts} onClose={() => setConcepts(false)} />

      <ConfirmModal
        isOpen={voiding !== null}
        onClose={() => setVoiding(null)}
        onConfirm={handleVoid}
        loading={voidBusy}
        variant="danger"
        title={voiding ? `Anular gasto de ${bs(voiding.amount)}` : 'Anular gasto'}
        message="Deja de contar en los totales y reportes. El registro se conserva en el historial."
        confirmLabel="Anular gasto"
        cancelLabel="Volver"
      />
    </PageShell>
  );
}
