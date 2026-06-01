import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/auth.context';
import { useSettingsStore } from '../store/settings.store';
import { ParticipantsList } from '../components/raffles/ParticipantsModal';
import { Button } from '../components/ui/Button';
import { Icon } from '../components/ui/Icon';
import { Spinner } from '../components/ui/Spinner';
import type { RaffleStatus } from '@pos/shared';
import { StatusBadge } from '../components/raffles/StatusBadge';
import { IconTicket, IconPackage, IconDice, IconCoins } from '../components/raffles/RaffleIcons';
import { WinnerModal } from '../components/raffles/WinnerModal';
import { DrawingScreen } from '../components/raffles/DrawingScreen';
import { useRaffleDetail, type BusyState } from '../hooks/useRaffleDetail';
import { positionLabel } from '../utils/raffle-utils';
import { downloadExcelSheets } from '../utils/excel';
import { EditRaffleModal } from '../components/raffles/EditRaffleModal';
import { PrizesSection } from '../components/raffles/PrizesSection';

// ─── Confirm draw ─────────────────────────────────────────────────────────────

function ConfirmDrawModal({
  nextPosition, raffleName, availableTickets, onConfirm, onCancel, loading,
}: {
  nextPosition: number; raffleName: string; availableTickets: number;
  onConfirm: () => void; onCancel: () => void; loading: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative rounded-2xl shadow-2xl border border-white/8 w-full max-w-sm p-6 space-y-4" style={{ background: 'var(--color-surface-card)' }}>
        <h3 className="text-base font-bold text-gray-900">
          Sortear {positionLabel(nextPosition)}
        </h3>
        <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
          <p className="text-sm font-semibold text-amber-900 mb-1.5">Esta acción no se puede deshacer</p>
          <p className="text-xs text-amber-700 leading-relaxed">
            Se sorteará el <strong>{positionLabel(nextPosition)}</strong> del sorteo{' '}
            <strong>"{raffleName}"</strong> entre los{' '}
            <strong>{availableTickets} tickets disponibles</strong> en el ánfora.
          </p>
        </div>
        <div className="flex gap-2 pt-1">
          <Button variant="secondary" onClick={onCancel} disabled={loading}>Cancelar</Button>
          <Button variant="primary" fullWidth onClick={onConfirm} loading={loading}>
            <span className="flex items-center justify-center gap-2">
              <IconDice className="w-4 h-4" />
              Sortear ahora
            </span>
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Delete confirm dialog ────────────────────────────────────────────────────

function DeleteRaffleDialog({
  raffleName, busy, deleted, onConfirm, onCancel,
}: {
  raffleName: string; busy: BusyState; deleted: boolean;
  onConfirm: () => void; onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative rounded-2xl shadow-2xl border border-white/8 w-full max-w-sm p-6 flex flex-col gap-4" style={{ background: 'var(--color-surface-card)' }}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
            <Icon name="warning" size={20} strokeWidth={2} className="text-red-600" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-900">¿Eliminar sorteo?</h3>
            <p className="text-xs text-gray-500 mt-0.5">"{raffleName}"</p>
          </div>
        </div>
        <p className="text-xs text-gray-600 leading-relaxed">
          Se eliminarán todos los tickets y acumulados asociados. Esta acción no se puede deshacer.
        </p>
        <div className="flex gap-2 justify-end">
          <button
            onClick={onCancel}
            className="text-sm text-gray-600 hover:text-gray-800 px-4 py-2 rounded-xl hover:bg-gray-100 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={busy === 'delete' || deleted}
            className="text-sm font-semibold text-white bg-red-500 hover:bg-red-600 px-4 py-2 rounded-xl transition-colors disabled:opacity-50"
          >
            {busy === 'delete' ? 'Eliminando…' : 'Sí, eliminar'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

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
    raffle, setRaffle, loading, error, busy, deleted,
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
  const { businessAddress, businessPhone, receiptSlogan, tenantLogo } = useSettingsStore();
  const business = {
    name:    user?.tenantName ?? '',
    address: businessAddress || undefined,
    phone:   businessPhone   || undefined,
    logoUrl: tenantLogo,
  };
  const ticketPrintSettings = {
    businessName:    user?.tenantName ?? '',
    businessAddress: businessAddress || undefined,
    businessPhone:   businessPhone   || undefined,
    receiptSlogan:   receiptSlogan   || undefined,
  };

  const isSpending = raffle?.ticketMode === 'SPENDING_THRESHOLD';
  const participantCount = isSpending ? (raffle?.spendings.length ?? 0) : (raffle?.tickets.length ?? 0);

  return (
    <>
      <div className="p-4 lg:p-6 max-w-3xl mx-auto">

        {/* ── Navegación — Fix 5: deshabilitado durante operaciones ───────── */}
        <button
          onClick={goBack}
          disabled={!!busy}
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 mb-5 group transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Icon name="chevron-left" size={16} strokeWidth={2} className="group-hover:-translate-x-0.5 transition-transform" />
          Volver a Sorteos
        </button>

        {/* Fix 3: lógica tristate — loading / error / contenido */}
        {loading ? (
          <div className="flex justify-center py-20"><Spinner /></div>
        ) : error || !raffle ? (
          <div className="rounded-2xl border border-red-100 bg-red-50 p-8 text-center">
            <p className="text-sm font-semibold text-red-700 mb-1">No se pudo cargar el sorteo</p>
            <p className="text-xs text-red-500 mb-4">Es posible que haya sido eliminado o no tengas acceso.</p>
            <button
              onClick={goBack}
              className="text-sm font-medium text-red-600 hover:text-red-800 underline underline-offset-2"
            >
              Volver a Sorteos
            </button>
          </div>
        ) : (
          <div className="space-y-5">

            {/* ── Encabezado de la página ──────────────────────────────────── */}
            <div className="rounded-2xl border border-white/8 shadow-[0_10px_30px_oklch(0.06_0.010_38/0.6)] p-5" style={{ background: 'var(--color-surface-card)' }}>
              <div className="flex items-start justify-between gap-3 mb-3">
                <h1 className="text-2xl font-black text-gray-900 font-heading leading-tight">
                  {raffle.name}
                </h1>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => setEditOpen(true)}
                    disabled={!!busy}
                    className="text-gray-300 hover:text-violet-500 transition-colors p-1.5 rounded-lg hover:bg-violet-50 disabled:opacity-40"
                    title="Editar sorteo"
                  >
                    <Icon name="edit" size={16} strokeWidth={2} />
                  </button>
                  {isDeletable && (
                    <button
                      onClick={() => setDeleteConfirm(true)}
                      disabled={!!busy}
                      className="text-gray-300 hover:text-red-400 transition-colors p-1.5 rounded-lg hover:bg-red-50 disabled:opacity-40"
                      title="Eliminar sorteo"
                    >
                      <Icon name="trash" size={16} strokeWidth={2} />
                    </button>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <StatusBadge status={raffle.status as RaffleStatus} />

                {isSpending ? (
                  <span className="inline-flex items-center gap-1 text-xs text-amber-700 bg-amber-50 border border-amber-100 px-2.5 py-1 rounded-full font-medium">
                    <IconCoins className="w-3 h-3 text-amber-500" />
                    Cada {raffle.spendingThreshold} Bs = 1 ticket
                  </span>
                ) : raffle.productName ? (
                  <span className="inline-flex items-center gap-1 text-xs text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full">
                    <IconPackage className="w-3 h-3 text-gray-400" />
                    {raffle.productName}
                  </span>
                ) : null}

                <span className="ml-auto text-xs text-gray-400 font-medium tabular-nums">
                  {activeWinnersCount} / {raffle.numberOfWinners} sorteados
                </span>
              </div>

              {raffle.description && (
                <p className="text-sm text-gray-500 leading-relaxed mt-3">{raffle.description}</p>
              )}
            </div>

            {/* ── Premios ──────────────────────────────────────────────────── */}
            <PrizesSection
              prizes={raffle.prizes}
              winners={raffle.winners}
              raffleName={raffle.name}
              canVoid={canVoid}
              busy={busy}
              voidConfirmId={voidConfirmId}
              onVoidRequest={setVoidConfirmId}
              onVoidConfirm={handleVoidWinner}
              onVoidCancel={() => setVoidConfirmId(null)}
              business={business}
            />

            {/* ── Stats ────────────────────────────────────────────────────── */}
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-white/8 shadow-[0_10px_30px_oklch(0.06_0.010_38/0.6)] px-5 py-4" style={{ background: 'var(--color-surface-card)' }}>
                <p className="text-[11px] text-gray-400 font-medium mb-1">
                  {isDrawable && !isActive ? 'Tickets disponibles' : 'Tickets en ánfora'}
                </p>
                <div className="flex items-end gap-1.5">
                  <span className="font-heading font-black text-3xl text-gray-900 leading-none">
                    {availableTickets.length}
                  </span>
                  {raffle.ticketCount !== availableTickets.length && (
                    <span className="text-sm text-gray-400 mb-0.5">/ {raffle.ticketCount}</span>
                  )}
                </div>
                <div className="flex items-center gap-1 mt-1.5">
                  <IconTicket className="w-3 h-3 text-gray-300" />
                  <span className="text-[10px] text-gray-400">total emitidos</span>
                </div>
              </div>

              <div className="rounded-2xl border border-white/8 shadow-[0_10px_30px_oklch(0.06_0.010_38/0.6)] px-5 py-4" style={{ background: 'var(--color-surface-card)' }}>
                <p className="text-[11px] text-gray-400 font-medium mb-1">
                  {isSpending ? 'Clientes' : 'Participantes'}
                </p>
                <span className="font-heading font-black text-3xl text-gray-900 leading-none">
                  {participantCount}
                </span>
              </div>
            </div>

            {/* ── Participantes (inline) ────────────────────────────────────── */}
            <section className="rounded-2xl border border-white/8 shadow-[0_10px_30px_oklch(0.06_0.010_38/0.6)] p-5" style={{ background: 'var(--color-surface-card)' }}>
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3">
                {isSpending ? 'Clientes y acumulados' : 'Participantes'}
              </p>
              <ParticipantsList raffle={raffle} printSettings={ticketPrintSettings} />
            </section>

            {/* ── Acciones ─────────────────────────────────────────────────── */}
            {(isActive || isReopenable || isDrawable || activeWinnersCount > 0) && (
              <div className="rounded-2xl border border-white/8 shadow-[0_10px_30px_oklch(0.06_0.010_38/0.6)] p-5 space-y-3" style={{ background: 'var(--color-surface-card)' }}>
                {isDrawable && raffle.nextPositionToDraw !== null && (
                  <Button
                    variant="primary"
                    fullWidth
                    onClick={() => setShowConfirm(true)}
                    disabled={!!busy || availableTickets.length === 0}
                  >
                    <span className="flex items-center justify-center gap-2">
                      <IconDice className="w-4 h-4" />
                      Sortear {positionLabel(raffle.nextPositionToDraw)}
                    </span>
                  </Button>
                )}

                <div className="flex items-center gap-2 flex-wrap">
                  {isActive && (
                    <Button variant="secondary" size="sm" onClick={handleClose}
                      loading={busy === 'close'} disabled={!!busy}>
                      Cerrar sorteo
                    </Button>
                  )}
                  {isReopenable && (
                    <Button variant="secondary" size="sm" onClick={handleReopen}
                      loading={busy === 'reopen'} disabled={!!busy}>
                      Reabrir sorteo
                    </Button>
                  )}
                  {activeWinnersCount > 0 && (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        const activeWinners = raffle.winners
                          .filter((w) => !w.voided)
                          .sort((a, b) => a.position - b.position);
                        downloadExcelSheets(`ganadores-${raffle.name}`, [{
                          title: 'Ganadores',
                          headers: ['Posición', 'Nombre', 'Teléfono', 'Nro. Ticket', 'Fecha sorteo', 'Premio'],
                          rows: activeWinners.map((w) => [
                            positionLabel(w.position),
                            w.customer.name,
                            w.customer.phone ?? '—',
                            String(w.ticketNumber),
                            new Date(w.drawnAt).toLocaleDateString('es-BO'),
                            w.prizeDescription ?? '—',
                          ]),
                        }]);
                      }}
                    >
                      Exportar ganadores
                    </Button>
                  )}
                </div>
              </div>
            )}

          </div>
        )}
      </div>

      {/* ── Overlays (se montan sobre la página igual que sobre el modal) ─── */}

      {showConfirm && raffle?.nextPositionToDraw !== null && raffle && (
        <ConfirmDrawModal
          nextPosition={raffle.nextPositionToDraw!}
          raffleName={raffle.name}
          availableTickets={availableTickets.length}
          onConfirm={handleDraw}
          onCancel={() => setShowConfirm(false)}
          loading={busy === 'draw'}
        />
      )}

      {drawingPosition !== null && (
        <DrawingScreen
          position={drawingPosition}
          names={availableTickets.map((t) => t.customer.name)}
          revealName={pendingWinnerName}
        />
      )}

      {drawnWinner && raffle && (
        <WinnerModal raffleName={raffle.name} winner={drawnWinner} onClose={() => setDrawnWinner(null)} />
      )}

      {editOpen && raffle && (
        <EditRaffleModal
          raffle={raffle}
          onClose={() => setEditOpen(false)}
          onUpdated={(updated) => setRaffle(updated)}
        />
      )}

      {deleteConfirm && raffle && (
        <DeleteRaffleDialog
          raffleName={raffle.name}
          busy={busy}
          deleted={deleted}
          onConfirm={handleDelete}
          onCancel={() => setDeleteConfirm(false)}
        />
      )}
    </>
  );
}
