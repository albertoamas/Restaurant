import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { CashSessionStatus, UserRole } from '@pos/shared';
import { cashSessionApi } from '../api/cash-session.api';
import { useAuth, BRANCH_PINNED_KEY } from '../context/auth.context';
import { useSettingsStore } from '../store/settings.store';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Card } from '../components/ui/Card';
import { EmptyState } from '../components/ui/EmptyState';
import { PageHeader } from '../components/ui/PageHeader';
import { PageShell } from '../components/ui/PageShell';
import { Skeleton } from '../components/ui/Skeleton';
import { useCashSession } from '../hooks/useCashSession';
import { useBranches, useBranchNames } from '../hooks/useBranches';
import { formatBoliviaDayMonth, formatBoliviaTime } from '../utils/date';
import { handleApiError } from '../utils/api-error';
import { CashAmountModal } from '../components/cash/CashAmountModal';
import { HistoryModal } from '../components/cash/HistoryModal';
import { CashSessionRow } from '../components/cash/CashSessionRow';
import { OpenShift, ClosedShift } from '../components/cash/CurrentShift';

/** Cierres que se ven en la página; el resto, en "Ver todos". */
const RECENT_CLOSINGS = 5;

/** El dueño en la vista consolidada: la caja es de cada sucursal, así que elige una aquí mismo. */
function PickBranch() {
  const { setCurrentBranch } = useAuth();
  const { branches: all } = useBranches();
  const branches = all.filter((b) => b.isActive);
  const select = (id: string) => {
    // Igual que el selector del menú: la elección del dueño se respeta entre sesiones.
    localStorage.setItem(BRANCH_PINNED_KEY, '1');
    setCurrentBranch(id);
  };
  return (
    <EmptyState
      icon="building"
      title="Elige una sucursal"
      description="Cada sucursal tiene su propia caja."
      action={branches.length > 0 && (
        <div className="flex flex-wrap justify-center gap-2">
          {branches.map((b) => (
            <Button key={b.id} variant="secondary" onClick={() => select(b.id)}>{b.name}</Button>
          ))}
        </div>
      )}
    />
  );
}

export function CashPage() {
  const { cashEnabled } = useSettingsStore();
  const { currentBranchId, user } = useAuth();
  const isOwner = user?.role === UserRole.OWNER;
  const { session, history, loading, reload } = useCashSession(currentBranchId);
  const { branchName } = useBranchNames();
  const branchLabel = branchName(currentBranchId);
  const [showOpen, setShowOpen] = useState(false);
  const [showClose, setShowClose] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  if (!cashEnabled) return <Navigate to="/pos" replace />;

  const isOpen = session?.status === CashSessionStatus.OPEN;
  const closedSessions = history.filter((s) => s.status === CashSessionStatus.CLOSED);
  const lastClosed = closedSessions[0] ?? null;

  const header = (
    <PageHeader
      title="Caja"
      description={branchLabel ? `Sucursal ${branchLabel}` : undefined}
      meta={currentBranchId && !loading && (
        isOpen ? <Badge variant="success" dot>Abierta</Badge> : <Badge dot>Cerrada</Badge>
      )}
    />
  );

  if (!currentBranchId) {
    return <PageShell>{header}<PickBranch /></PageShell>;
  }

  const handleOpen = async (amount: number, notes?: string) => {
    try {
      await cashSessionApi.open({ openingAmount: amount, notes }, currentBranchId);
      toast.success('Caja abierta');
      setShowOpen(false);
      reload();
    } catch (err) {
      handleApiError(err, 'Error al abrir caja');
    }
  };

  const handleClose = async (amount: number, notes?: string) => {
    try {
      await cashSessionApi.close({ closingAmount: amount, notes }, currentBranchId);
      toast.success('Caja cerrada');
      setShowClose(false);
      reload();
    } catch (err) {
      handleApiError(err, 'Error al cerrar caja');
    }
  };

  // Los cierres muestran el esperado y la diferencia: son del dueño.
  const showClosings = isOwner;

  return (
    <PageShell>
      {header}

      <div className={showClosings ? 'grid gap-4 lg:grid-cols-[minmax(0,1fr)_380px] items-start' : 'max-w-3xl'}>
        {loading ? (
          <Skeleton variant="card" />
        ) : isOpen && session ? (
          <OpenShift session={session} isOwner={isOwner} onClose={() => setShowClose(true)} />
        ) : (
          <ClosedShift isOwner={isOwner} onOpen={() => setShowOpen(true)} />
        )}

        {showClosings && (
          <Card padding="none">
            <div className="flex items-center justify-between gap-3 px-5 pt-4">
              <h2 className="text-heading font-semibold text-main">Últimos cierres</h2>
              {closedSessions.length > RECENT_CLOSINGS && (
                <Button variant="ghost" size="sm" onClick={() => setShowHistory(true)}>
                  Ver todos ({closedSessions.length})
                </Button>
              )}
            </div>
            {loading ? (
              <div className="p-5"><Skeleton variant="rect" h="160px" /></div>
            ) : closedSessions.length === 0 ? (
              <EmptyState compact icon="cash" title="Todavía no hay cierres" description="Aquí verás cada cierre con lo que se contó y si cuadró." />
            ) : (
              <ul className="px-5 pb-2 divide-y divide-line">
                {closedSessions.slice(0, RECENT_CLOSINGS).map((s) => <CashSessionRow key={s.id} session={s} />)}
              </ul>
            )}
          </Card>
        )}
      </div>

      <CashAmountModal
        isOpen={showOpen}
        onClose={() => setShowOpen(false)}
        onConfirm={handleOpen}
        title="Abrir caja"
        amountLabel="Efectivo con el que empieza el cajón"
        amountHint="Billetes y monedas para dar cambio."
        confirmLabel="Abrir caja"
        suggestion={lastClosed ? {
          amount: lastClosed.openingAmount,
          label: `Usar Bs ${lastClosed.openingAmount.toFixed(2)}, como el turno del ${formatBoliviaDayMonth(lastClosed.openedAt)}`,
        } : undefined}
      />

      <CashAmountModal
        isOpen={showClose}
        onClose={() => setShowClose(false)}
        onConfirm={handleClose}
        title="Cerrar caja"
        subtitle={session ? `Abierta el ${formatBoliviaDayMonth(session.openedAt)} a las ${formatBoliviaTime(session.openedAt)}` : undefined}
        amountLabel="Efectivo contado"
        amountHint="Cuenta el efectivo del cajón y escribe el total."
        confirmLabel="Cerrar caja"
        breakdown={session ? {
          openingAmount: session.openingAmount,
          cashSales: session.cashSales ?? 0,
          expectedAmount: session.openingAmount + (session.cashSales ?? 0),
        } : undefined}
      />

      <HistoryModal
        isOpen={showHistory}
        sessions={closedSessions}
        onClose={() => setShowHistory(false)}
      />
    </PageShell>
  );
}
