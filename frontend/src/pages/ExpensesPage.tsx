import { useState } from 'react';
import toast from 'react-hot-toast';
import { UserRole } from '@pos/shared';
import type { ExpenseConceptDto, ExpenseDto } from '@pos/shared';
import { expensesApi } from '../api/expenses.api';
import { useExpenses } from '../hooks/useExpenses';
import { useAuth } from '../context/auth.context';
import { useBranchNames } from '../hooks/useBranches';
import { ConfirmModal } from '../components/ui/ConfirmModal';
import { EmptyState } from '../components/ui/EmptyState';
import { PageHeader } from '../components/ui/PageHeader';
import { PageShell } from '../components/ui/PageShell';
import { SegmentedControl } from '../components/ui/SegmentedControl';
import { Skeleton } from '../components/ui/Skeleton';
import { PickBranch } from '../components/branch/PickBranch';
import { bs } from '../components/report';
import { ExpenseEditModal } from '../components/expenses/ExpenseEditModal';
import { ExpensePicker } from '../components/expenses/ExpensePicker';
import { QuickExpenseDialog } from '../components/expenses/QuickExpenseDialog';
import { ConceptFormModal, type ConceptFormTarget } from '../components/expenses/ConceptFormModal';
import { ExpenseCatalog } from '../components/expenses/ExpenseCatalog';
import { ExpenseList } from '../components/expenses/ExpenseList';
import { ExpenseMovements } from '../components/expenses/ExpenseMovements';
import { ExpenseDetailSheet } from '../components/expenses/ExpenseDetailSheet';
import { handleApiError } from '../utils/api-error';
import { formatDayRange, today } from '../utils/date';
import { getBoliviaDayBounds } from '../utils/timezone';

type Tab = 'register' | 'movements' | 'catalog';


const TAB_HINT: Record<Tab, string> = {
  register:  'Toca el gasto y escribe el monto',
  movements: 'Revisa, corrige o anula',
  catalog:   'Los gastos que registras seguido y sus categorías',
};

/**
 * Gastos en tres pestañas: Registrar (lo frecuente: tocar el gasto y escribir el monto),
 * Movimientos (revisar un período, filtrar, corregir o anular) y Lista (qué gastos existen y sus
 * categorías). Se abre en Registrar.
 */
export function ExpensesPage() {
  const { currentBranchId, user } = useAuth();
  const { branchName } = useBranchNames();
  const [tab, setTab] = useState<Tab>('register');
  // Movimientos se monta al abrirla por primera vez y queda montada: conserva filtros y página.
  const [movementsVisited, setMovementsVisited] = useState(false);

  const [active, setActive]             = useState<ExpenseConceptDto | null>(null);
  const [creating, setCreating]         = useState<ConceptFormTarget | null>(null);
  const [detail, setDetail]             = useState<ExpenseDto | null>(null);
  const [editing, setEditing]           = useState<ExpenseDto | null>(null);
  const [voiding, setVoiding]           = useState<ExpenseDto | null>(null);
  const [voidBusy, setVoidBusy]         = useState(false);

  const isOwner = user?.role === UserRole.OWNER;
  const branchParam = isOwner ? (currentBranchId ?? undefined) : undefined;
  // Un gasto siempre es de una sucursal: en la vista consolidada primero se elige una.
  const canRegister = !isOwner || currentBranchId !== null;
  const scope = currentBranchId ? `Sucursal ${branchName(currentBranchId) ?? 'elegida'}` : 'Todas las sucursales';

  // "Registrado hoy": pocos movimientos, se piden completos.
  const todayStr = today();
  const { start: todayFrom, end: todayTo } = getBoliviaDayBounds(todayStr);
  // `invalidate` refresca todo lo de gastos: también Movimientos, aunque el socket esté caído.
  const { expenses: todayExpenses, summary: todaySummary, loading: todayLoading, invalidate } =
    useExpenses(todayFrom, todayTo, branchParam);

  const changeTab = (t: Tab) => { setTab(t); if (t === 'movements') setMovementsVisited(true); };

  const handleVoid = async () => {
    if (!voiding) return;
    setVoidBusy(true);
    try {
      await expensesApi.void(voiding.id);
      toast.success('Gasto anulado. El registro se conserva en el historial.');
      setVoiding(null);
      invalidate();
    } catch (err) {
      handleApiError(err, 'Error al anular el gasto');
    } finally {
      setVoidBusy(false);
    }
  };

  return (
    <PageShell>
      <PageHeader
        title="Gastos"
        description={`${TAB_HINT[tab]}. ${scope}.`}
        actions={
          <SegmentedControl
            label="Sección de gastos"
            value={tab}
            onChange={changeTab}
            options={[
              { value: 'register', label: 'Registrar' },
              { value: 'movements', label: 'Movimientos' },
              { value: 'catalog', label: 'Lista' },
            ]}
          />
        }
      />

      {tab === 'register' && (
        <div className="space-y-4">
          <section className="rounded-card border border-line bg-surface-card shadow-raised p-4 sm:p-5">
            {canRegister ? (
              <ExpensePicker
                onPick={setActive}
                onAdd={(name) => setCreating({ mode: 'create', name, thenRegister: true })}
              />
            ) : (
              <PickBranch description="Cada gasto se registra en una sucursal." />
            )}
          </section>

          <section className="overflow-hidden rounded-card border border-line bg-surface-card shadow-raised">
            <div className="flex items-baseline justify-between gap-3 px-4 py-3 sm:px-5">
              <h2 className="text-heading font-semibold text-main">Registrado hoy</h2>
              <span className="text-body font-semibold text-main tabular-nums">{bs(todaySummary.total)}</span>
            </div>
            <div className="border-t border-line">
              {todayLoading ? (
                <div className="p-4"><Skeleton variant="rect" h="96px" /></div>
              ) : todayExpenses.length === 0 ? (
                <EmptyState compact icon="receipt" title={`Nada registrado hoy, ${formatDayRange(todayStr, todayStr)}`} description="Lo que registres aparece aquí para revisarlo al momento." />
              ) : (
                <ExpenseList expenses={todayExpenses} onOpen={setDetail} />
              )}
            </div>
          </section>
        </div>
      )}

      {tab === 'catalog' && <ExpenseCatalog />}

      {movementsVisited && (
        <div hidden={tab !== 'movements'}>
          <ExpenseMovements branchId={branchParam} onOpen={setDetail} />
        </div>
      )}

      {active && (
        <QuickExpenseDialog
          concept={active}
          onClose={() => setActive(null)}
          onSaved={() => { setActive(null); invalidate(); }}
        />
      )}

      {creating && (
        <ConceptFormModal
          target={creating}
          onClose={() => setCreating(null)}
          // Encadena directo al registro: para eso lo estaba agregando.
          onSaved={(concept) => setActive(concept)}
        />
      )}

      <ExpenseDetailSheet
        expense={detail}
        onClose={() => setDetail(null)}
        onEdit={(e) => { setDetail(null); setEditing(e); }}
        onVoid={(e) => { setDetail(null); setVoiding(e); }}
      />
      {editing && <ExpenseEditModal expense={editing} onClose={() => setEditing(null)} onSaved={invalidate} />}

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
