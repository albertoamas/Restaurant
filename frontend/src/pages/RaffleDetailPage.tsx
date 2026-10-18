import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import type { RaffleStatus } from '@pos/shared';
import { useAuth } from '../context/auth.context';
import { useSettingsStore } from '../store/settings.store';
import { ActionMenu, type ActionMenuItem } from '../components/ui/ActionMenu';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { ConfirmModal } from '../components/ui/ConfirmModal';
import { EmptyState } from '../components/ui/EmptyState';
import { Icon } from '../components/ui/Icon';
import { PageHeader } from '../components/ui/PageHeader';
import { PageShell } from '../components/ui/PageShell';
import { Skeleton } from '../components/ui/Skeleton';
import { Kpi } from '../components/report';
import { ParticipantsList } from '../components/raffles/ParticipantsModal';
import { StatusBadge } from '../components/raffles/StatusBadge';
import { ticketRule } from '../components/raffles/RaffleCard';
import { WinnerModal } from '../components/raffles/WinnerModal';
import { VoidWinnerModal } from '../components/raffles/VoidWinnerModal';
import { DrawingScreen } from '../components/raffles/DrawingScreen';
import { EditRaffleModal } from '../components/raffles/EditRaffleModal';
import { PrizesSection } from '../components/raffles/PrizesSection';
import { useRaffleDetail } from '../hooks/useRaffleDetail';
import { positionLabel } from '../utils/raffle-utils';
import { downloadExcelSheets } from '../utils/excel';

export function RaffleDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  if (!id) {
    navigate('/raffles', { replace: true });
    return null;
  }
  return <RaffleDetailContent id={id} />;
}

function RaffleDetailContent({ id }: { id: string }) {
  const navigate = useNavigate();
  const goBack = () => navigate('/raffles');
  const [editOpen, setEditOpen] = useState(false);

  const {
    raffle, setRaffle, loading, error, busy,
    showConfirm, setShowConfirm,
    deleteConfirm, setDeleteConfirm,
    drawingPosition, pendingWinnerName,
    drawnWinner, setDrawnWinner,
    voidConfirmId, setVoidConfirmId,
    handleClose, handleReopen, handleVoidWinner, handleDelete, handleDraw,
    isDrawable, isDeletable, isActive, isReopenable, canVoid,
    availableTickets, activeWinnersCount,
  } = useRaffleDetail(id, goBack, () => {});

  const { user } = useAuth();
  const { businessAddress, businessPhone, receiptSlogan } = useSettingsStore();
  const business = { name: user?.tenantName ?? '', address: businessAddress || undefined, phone: businessPhone || undefined };
  const ticketPrintSettings = {
    businessName:    user?.tenantName ?? '',
    businessAddress: businessAddress || undefined,
    businessPhone:   businessPhone   || undefined,
    receiptSlogan:   receiptSlogan   || undefined,
  };

  const back = (
    <Button variant="ghost" size="sm" className="mb-2 -ml-2" onClick={goBack} disabled={!!busy}>
      Volver a Sorteos
    </Button>
  );

  if (loading) {
    return <PageShell>{back}<div className="space-y-4"><Skeleton variant="card" /><Skeleton variant="card" /></div></PageShell>;
  }
  if (error || !raffle) {
    return (
      <PageShell>
        {back}
        <EmptyState
          icon="ticket"
          title="No se pudo abrir el sorteo"
          description="Puede que lo hayan eliminado o que no tengas acceso."
          action={<Button variant="secondary" onClick={goBack}>Volver a Sorteos</Button>}
        />
      </PageShell>
    );
  }

  const next = raffle.nextPositionToDraw;
  const participantCount = new Set(raffle.tickets.map((t) => t.customerId)).size;
  const voiding = raffle.winners.find((w) => w.id === voidConfirmId) ?? null;

  const exportWinners = () => {
    const rows = raffle.winners.filter((w) => !w.voided).sort((a, b) => a.position - b.position);
    downloadExcelSheets(`ganadores-${raffle.name}`, [{
      title: 'Ganadores',
      headers: ['Lugar', 'Nombre', 'Teléfono', 'Ticket', 'Fecha del sorteo', 'Premio'],
      rows: rows.map((w) => [
        positionLabel(w.position), w.customer.name, w.customer.phone ?? '-', String(w.ticketNumber),
        new Date(w.drawnAt).toLocaleDateString('es-BO'), w.prizeDescription ?? '-',
      ]),
    }]);
  };

  const menu: ActionMenuItem[] = [
    { label: 'Editar sorteo', icon: 'edit', onSelect: () => setEditOpen(true) },
    ...(isActive ? [{ label: 'Cerrar sorteo', icon: 'lock' as const, onSelect: () => { void handleClose(); } }] : []),
    ...(isReopenable ? [{ label: 'Reabrir sorteo', icon: 'refresh' as const, onSelect: () => { void handleReopen(); } }] : []),
    ...(activeWinnersCount > 0 ? [{ label: 'Exportar ganadores', icon: 'download' as const, onSelect: exportWinners }] : []),
    ...(isDeletable ? [{ label: 'Eliminar sorteo', icon: 'trash' as const, danger: true, onSelect: () => setDeleteConfirm(true) }] : []),
  ];

  return (
    <PageShell>
      {back}
      <PageHeader
        title={raffle.name}
        meta={<StatusBadge status={raffle.status as RaffleStatus} />}
        description={ticketRule(raffle)}
        actions={
          <>
            {isDrawable && next !== null && (
              <Button onClick={() => setShowConfirm(true)} disabled={!!busy || availableTickets.length === 0}>
                <Icon name="star" size={18} />
                Sortear el {positionLabel(next)}
              </Button>
            )}
            <ActionMenu label="Más acciones del sorteo" items={menu} />
          </>
        }
      >
        {raffle.description && <p className="text-body text-soft">{raffle.description}</p>}
        {isActive && next !== null && (
          <p className="mt-2 text-label text-amber-800 dark:text-amber-300">Cierra el sorteo para poder sortear: así no entran tickets nuevos mientras se elige a los ganadores.</p>
        )}
        {isDrawable && next !== null && availableTickets.length === 0 && (
          <p className="mt-2 text-label text-amber-800 dark:text-amber-300">Para sortear hace falta al menos un ticket de un cliente que aún no haya ganado.</p>
        )}
      </PageHeader>

      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Kpi
          label="Tickets en el ánfora"
          value={String(availableTickets.length)}
          sub={raffle.ticketCount !== availableTickets.length ? `De ${raffle.ticketCount} emitidos` : undefined}
        />
        <Kpi label="Participantes" value={String(participantCount)} />
        <div className="max-sm:col-span-2"><Kpi label="Sorteados" value={`${activeWinnersCount} de ${raffle.numberOfWinners}`} /></div>
      </div>

      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        <Card padding="none">
          <h2 className="px-4 pt-4 pb-2 text-heading font-semibold text-main sm:px-5">Premios</h2>
          <PrizesSection
            prizes={raffle.prizes}
            winners={raffle.winners}
            raffleName={raffle.name}
            canVoid={canVoid}
            onVoid={(w) => setVoidConfirmId(w.id)}
            business={business}
          />
        </Card>

        <Card padding="none">
          <h2 className="px-4 pt-4 pb-3 text-heading font-semibold text-main sm:px-5">Participantes</h2>
          <ParticipantsList raffle={raffle} printSettings={ticketPrintSettings} />
        </Card>
      </div>

      <ConfirmModal
        isOpen={showConfirm && next !== null}
        onClose={() => setShowConfirm(false)}
        onConfirm={handleDraw}
        loading={busy === 'draw'}
        title={next !== null ? `Sortear el ${positionLabel(next)}` : 'Sortear'}
        message={`Sale un ganador entre los ${availableTickets.length} tickets del ánfora. El resultado queda registrado y no se puede repetir.`}
        confirmLabel="Sortear ahora"
        cancelLabel="Volver"
      />

      {voiding && (
        <VoidWinnerModal
          winner={voiding}
          loading={!!busy && busy.startsWith('void-')}
          onClose={() => setVoidConfirmId(null)}
          onConfirm={(reason) => { void handleVoidWinner(voiding.id, reason); }}
        />
      )}

      <ConfirmModal
        isOpen={deleteConfirm}
        onClose={() => setDeleteConfirm(false)}
        onConfirm={handleDelete}
        loading={busy === 'delete'}
        variant="danger"
        title={`Eliminar "${raffle.name}"`}
        message="Se eliminan también sus tickets y los consumos acumulados. Esta acción no se puede deshacer."
        confirmLabel="Eliminar sorteo"
        cancelLabel="Volver"
      />

      {drawingPosition !== null && (
        <DrawingScreen
          position={drawingPosition}
          names={availableTickets.map((t) => t.customer.name)}
          revealName={pendingWinnerName}
          raffleName={raffle.name}
          prize={raffle.prizes.find((p) => p.position === drawingPosition)?.prizeDescription}
        />
      )}

      {drawnWinner && <WinnerModal raffleName={raffle.name} winner={drawnWinner} onClose={() => setDrawnWinner(null)} />}

      {editOpen && (
        <EditRaffleModal raffle={raffle} onClose={() => setEditOpen(false)} onUpdated={(updated) => setRaffle(updated)} />
      )}
    </PageShell>
  );
}
