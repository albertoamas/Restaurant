import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/auth.context';
import { useSettingsStore } from '../store/settings.store';
import { ParticipantsList } from '../components/raffles/ParticipantsModal';
import { Button } from '../components/ui/Button';
import { Spinner } from '../components/ui/Spinner';
import type { RaffleStatus } from '@pos/shared';
import { StatusBadge } from '../components/raffles/StatusBadge';
import { IconTicket, IconPackage, IconGift, IconAward, IconDice, IconCoins } from '../components/raffles/RaffleIcons';
import { WinnerModal } from '../components/raffles/WinnerModal';
import { DrawingScreen } from '../components/raffles/DrawingScreen';
import { useRaffleDetail } from '../hooks/useRaffleDetail';
import { positionLabel } from '../utils/raffle-utils';
import { printWinnerCertificate } from '../utils/raffle-certificate';
import { downloadExcelSheets } from '../utils/excel';

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
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4">
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

// ─── Position medal ───────────────────────────────────────────────────────────

const MEDAL: Record<number, string> = {
  1: 'bg-amber-100 text-amber-700 border-amber-300 ring-amber-100',
  2: 'bg-gray-100 text-gray-500 border-gray-300 ring-gray-100',
  3: 'bg-orange-50 text-orange-500 border-orange-200 ring-orange-50',
};

function PositionMedal({ position }: { position: number }) {
  const cls = MEDAL[position] ?? 'bg-gray-100 text-gray-500 border-gray-200 ring-gray-100';
  return (
    <span className={`w-8 h-8 rounded-full border flex items-center justify-center text-[11px] font-black shrink-0 ring-2 ${cls}`}>
      {position}°
    </span>
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

  const {
    raffle, loading, error, busy, deleted,
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
  const { businessAddress, businessPhone, tenantLogo } = useSettingsStore();
  const business = {
    name:    user?.tenantName ?? '',
    address: businessAddress || undefined,
    phone:   businessPhone   || undefined,
    logoUrl: tenantLogo,
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
          <svg className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
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
            <div className="rounded-2xl border border-white/70 bg-white/80 backdrop-blur-xl shadow-[0_10px_30px_oklch(0.13_0.012_260/0.10)] p-5">
              <div className="flex items-start justify-between gap-3 mb-3">
                <h1 className="text-2xl font-black text-gray-900 font-heading leading-tight">
                  {raffle.name}
                </h1>
                {isDeletable && (
                  <button
                    onClick={() => setDeleteConfirm(true)}
                    disabled={!!busy}
                    className="shrink-0 text-gray-300 hover:text-red-400 transition-colors p-1.5 rounded-lg hover:bg-red-50 disabled:opacity-40"
                    title="Eliminar sorteo"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                )}
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
            {raffle.prizes.length > 0 && (
              <section className="rounded-2xl border border-white/70 bg-white/80 backdrop-blur-xl shadow-[0_10px_30px_oklch(0.13_0.012_260/0.10)] p-5">
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3">Premios</p>
                <div className="space-y-2">
                  {raffle.prizes.map((p) => {
                    const activeWinner = raffle.winners.find((w) => w.position === p.position && !w.voided);
                    const voidedWinner = raffle.winners.find((w) => w.position === p.position && w.voided);
                    const isConfirming = voidConfirmId === activeWinner?.id;

                    return (
                      <div key={p.position} className={`rounded-xl border px-3.5 py-3 transition-colors ${
                        activeWinner
                          ? 'bg-amber-50 border-amber-200'
                          : 'bg-gray-50 border-transparent'
                      }`}>
                        <div className="flex items-center gap-3">
                          <PositionMedal position={p.position} />

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 mb-0.5">
                              <IconGift className="w-3 h-3 text-gray-400 shrink-0" />
                              <p className="text-sm font-semibold text-gray-700 truncate">{p.prizeDescription}</p>
                            </div>

                            {activeWinner && !isConfirming && (
                              <div className="flex items-center gap-1.5">
                                <IconAward className="w-3 h-3 text-amber-500 shrink-0" />
                                <span className="text-xs font-semibold text-amber-800 truncate">{activeWinner.customer.name}</span>
                                <div className="ml-auto flex items-center gap-0.5">
                                  <button
                                    onClick={() => printWinnerCertificate(activeWinner, raffle.name, business)}
                                    title="Imprimir certificado"
                                    className="text-gray-300 hover:text-primary-500 p-1 rounded-lg transition-colors"
                                  >
                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                                      <path strokeLinecap="round" strokeLinejoin="round"
                                        d="M6 9V3h12v6M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2M9 21h6v-6H9v6z" />
                                    </svg>
                                  </button>
                                  {canVoid && (
                                    <button
                                      onClick={() => setVoidConfirmId(activeWinner.id)}
                                      disabled={!!busy}
                                      className="text-[10px] text-gray-400 hover:text-red-500 hover:bg-red-50 px-2 py-0.5 rounded-lg transition-colors disabled:opacity-40"
                                    >
                                      Anular
                                    </button>
                                  )}
                                </div>
                              </div>
                            )}

                            {voidedWinner && !activeWinner && (
                              <p className="text-[10px] text-red-400 mt-0.5">
                                <span className="line-through">{voidedWinner.customer.name}</span>
                                {' '}· anulado
                              </p>
                            )}

                            {!activeWinner && !voidedWinner && (
                              <p className="text-[10px] text-gray-400 mt-0.5">Pendiente</p>
                            )}
                          </div>
                        </div>

                        {isConfirming && (
                          <div className="flex items-center gap-2 mt-2.5 pt-2.5 border-t border-amber-200">
                            <p className="text-xs text-red-600 font-semibold flex-1">
                              ¿Anular a <strong>{activeWinner!.customer.name}</strong>?
                            </p>
                            <button
                              onClick={() => handleVoidWinner(activeWinner!.id)}
                              disabled={!!busy}
                              className="text-[11px] font-bold text-white bg-red-500 hover:bg-red-600 px-3 py-1 rounded-lg transition-colors disabled:opacity-50"
                            >
                              Sí, anular
                            </button>
                            <button
                              onClick={() => setVoidConfirmId(null)}
                              className="text-[11px] text-gray-500 hover:text-gray-700 px-2 py-1 rounded-lg transition-colors"
                            >
                              Cancelar
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* ── Stats ────────────────────────────────────────────────────── */}
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-white/70 bg-white/80 backdrop-blur-xl shadow-[0_10px_30px_oklch(0.13_0.012_260/0.10)] px-5 py-4">
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

              <div className="rounded-2xl border border-white/70 bg-white/80 backdrop-blur-xl shadow-[0_10px_30px_oklch(0.13_0.012_260/0.10)] px-5 py-4">
                <p className="text-[11px] text-gray-400 font-medium mb-1">
                  {isSpending ? 'Clientes' : 'Participantes'}
                </p>
                <span className="font-heading font-black text-3xl text-gray-900 leading-none">
                  {participantCount}
                </span>
              </div>
            </div>

            {/* ── Participantes (inline) ────────────────────────────────────── */}
            <section className="rounded-2xl border border-white/70 bg-white/80 backdrop-blur-xl shadow-[0_10px_30px_oklch(0.13_0.012_260/0.10)] p-5">
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3">
                {isSpending ? 'Clientes y acumulados' : 'Participantes'}
              </p>
              <ParticipantsList raffle={raffle} />
            </section>

            {/* ── Acciones ─────────────────────────────────────────────────── */}
            {(isActive || isReopenable || isDrawable || activeWinnersCount > 0) && (
              <div className="rounded-2xl border border-white/70 bg-white/80 backdrop-blur-xl shadow-[0_10px_30px_oklch(0.13_0.012_260/0.10)] p-5 space-y-3">
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

      {deleteConfirm && raffle && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setDeleteConfirm(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-900">¿Eliminar sorteo?</h3>
                <p className="text-xs text-gray-500 mt-0.5">"{raffle.name}"</p>
              </div>
            </div>
            <p className="text-xs text-gray-600 leading-relaxed">
              Se eliminarán todos los tickets y acumulados asociados. Esta acción no se puede deshacer.
            </p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setDeleteConfirm(false)}
                className="text-sm text-gray-600 hover:text-gray-800 px-4 py-2 rounded-xl hover:bg-gray-100 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                disabled={busy === 'delete' || deleted}
                className="text-sm font-semibold text-white bg-red-500 hover:bg-red-600 px-4 py-2 rounded-xl transition-colors disabled:opacity-50"
              >
                {busy === 'delete' ? 'Eliminando…' : 'Sí, eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
