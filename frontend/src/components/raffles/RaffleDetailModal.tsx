import React, { useState, useEffect } from 'react';
import { ParticipantsModal } from './ParticipantsModal';
import { playDrawTick } from '../../utils/raffle-sounds';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Spinner } from '../ui/Spinner';
import type { RaffleStatus } from '@pos/shared';
import { StatusBadge } from './StatusBadge';
import { IconTicket, IconPackage, IconGift, IconAward, IconDice, IconCoins } from './RaffleIcons';
import { WinnerModal } from './WinnerModal';
import { useRaffleDetail, DRAW_DURATION_MS } from './useRaffleDetail';
import { positionLabel } from './raffle-utils';

// ─── Confirm draw ─────────────────────────────────────────────────────────────

function ConfirmDrawModal({
  nextPosition, raffleName, availableTickets, onConfirm, onCancel, loading,
}: {
  nextPosition: number; raffleName: string; availableTickets: number;
  onConfirm: () => void; onCancel: () => void; loading: boolean;
}) {
  return (
    <Modal isOpen onClose={onCancel} title={`Sortear ${positionLabel(nextPosition)}`} size="sm">
      <div className="space-y-4">
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
    </Modal>
  );
}

// ─── Drawing animation ────────────────────────────────────────────────────────

function DrawingModal({ position, names, revealName }: {
  position: number; names: string[]; revealName?: string | null;
}) {
  const pool = names.length > 0 ? names : ['—'];
  const [idx, setIdx] = useState(() => Math.floor(Math.random() * pool.length));
  const [phase, setPhase] = useState<'fast' | 'slowing' | 'stopped'>('fast');
  const startRef = React.useRef(Date.now());

  useEffect(() => {
    let cancelled = false;
    startRef.current = Date.now();
    const spin = () => {
      if (cancelled) return;
      const elapsed = Date.now() - startRef.current;
      const progress = Math.min(elapsed / DRAW_DURATION_MS, 1);
      const delay = 85 + 865 * (progress * progress * progress);
      setIdx((i) => (i + 1) % pool.length);
      playDrawTick(progress);
      if (progress < 0.42) setPhase('fast');
      else if (progress < 0.93) setPhase('slowing');
      if (progress < 0.97) { setTimeout(spin, delay); } else { setPhase('stopped'); }
    };
    const id = setTimeout(spin, 85);
    return () => { cancelled = true; clearTimeout(id); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Modal isOpen onClose={() => {}} title="" size="sm">
      <div className="text-center pb-6 pt-4 px-2 select-none">
        <p className="text-[10px] font-black uppercase tracking-[0.25em] text-violet-500 mb-1">Sorteando</p>
        <p className="text-base font-black font-heading text-gray-900 mb-5">{positionLabel(position)}</p>
        <div className="relative w-20 h-20 mx-auto mb-5">
          <div className="absolute inset-0 rounded-full border-4 border-violet-100" />
          <div className="absolute inset-0 rounded-full border-[3px] border-transparent border-t-violet-500 animate-spin" />
          <div className="absolute inset-1.5 rounded-full border-2 border-transparent border-b-violet-300 animate-spin"
            style={{ animationDirection: 'reverse', animationDuration: '0.5s' }} />
          <div className="absolute inset-0 flex items-center justify-center">
            <IconDice className="w-6 h-6 text-violet-400" />
          </div>
        </div>
        <div className="relative mx-auto w-full max-w-[300px] overflow-hidden" style={{ height: '160px' }}>
          <div className="absolute inset-x-0 top-0 h-10 bg-gradient-to-b from-white to-transparent z-10 pointer-events-none" />
          <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-white to-transparent z-10 pointer-events-none" />
          {[
            { top: 'top-0', h: 'h-8', cls: 'text-xs font-medium text-gray-200', offset: -2 },
            { top: 'top-8', h: 'h-9', cls: 'text-sm font-semibold text-gray-300', offset: -1 },
          ].map(({ top, h, cls, offset }) => (
            <div key={offset} className={`absolute inset-x-0 ${top} flex items-center justify-center ${h}`}>
              <span className={`${cls} truncate px-4`}>{pool[(idx + offset + pool.length) % pool.length]}</span>
            </div>
          ))}
          <div className={`absolute inset-x-0 top-[68px] flex items-center justify-center h-[42px] rounded-2xl mx-2 transition-colors duration-300 ${
            revealName ? 'bg-amber-50 border-2 border-amber-300' : phase === 'stopped' ? 'bg-violet-50 border-2 border-violet-200' : 'bg-gray-50'
          }`}>
            <span className={`font-black font-heading truncate px-4 transition-all duration-200 ${
              revealName ? 'text-amber-700 text-xl' : phase === 'stopped' ? 'text-violet-700 text-xl' : 'text-gray-900 text-lg'
            }`}>
              {revealName ?? pool[idx]}
            </span>
          </div>
          {[
            { top: 'top-[110px]', h: 'h-9', cls: 'text-sm font-semibold text-gray-300', offset: 1 },
            { top: 'top-[149px]', h: 'h-8', cls: 'text-xs font-medium text-gray-200', offset: 2 },
          ].map(({ top, h, cls, offset }) => (
            <div key={offset} className={`absolute inset-x-0 ${top} flex items-center justify-center ${h}`}>
              <span className={`${cls} truncate px-4`}>{revealName ? '' : pool[(idx + offset) % pool.length]}</span>
            </div>
          ))}
        </div>
        <div className="mt-5 flex justify-center gap-1.5 min-h-[20px]">
          {revealName ? (
            <span className="text-xs font-bold text-amber-600 animate-pulse tracking-wide uppercase">¡Ganador encontrado!</span>
          ) : phase !== 'stopped' ? (
            [0, 1, 2].map((i) => (
              <span key={i} className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-bounce"
                style={{ animationDelay: `${i * 160}ms` }} />
            ))
          ) : (
            <span className="text-xs font-semibold text-violet-500 animate-pulse">Calculando resultado…</span>
          )}
        </div>
      </div>
    </Modal>
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

// ─── Main modal ───────────────────────────────────────────────────────────────

export function RaffleDetailModal({ raffleId, onClose, onUpdate }: {
  raffleId: string; onClose: () => void; onUpdate: () => void;
}) {
  const {
    raffle, loading, busy,
    showConfirm, setShowConfirm,
    drawingPosition, pendingWinnerName,
    drawnWinner, setDrawnWinner,
    voidConfirmId, setVoidConfirmId,
    handleClose, handleReopen, handleVoidWinner, handleDelete, handleDraw,
    isDrawable, isDeletable, isActive, isReopenable, canVoid,
    availableTickets, activeWinnersCount,
  } = useRaffleDetail(raffleId, onClose, onUpdate);

  const [showParticipants, setShowParticipants] = useState(false);

  const isSpending = raffle?.ticketMode === 'SPENDING_THRESHOLD';
  const participantCount = isSpending ? (raffle?.spendings.length ?? 0) : (raffle?.tickets.length ?? 0);

  return (
    <>
      <Modal isOpen onClose={onClose} title={raffle?.name ?? 'Sorteo'} size="xl">
        {loading || !raffle ? (
          <div className="flex justify-center py-12"><Spinner /></div>
        ) : (
          <div className="space-y-5">

            {/* ── Badges de estado y modo ─────────────────────────────────── */}
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
              <p className="text-sm text-gray-500 leading-relaxed -mt-1">{raffle.description}</p>
            )}

            {/* ── Premios ─────────────────────────────────────────────────── */}
            {raffle.prizes.length > 0 && (
              <section>
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2.5">Premios</p>
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
                                {canVoid && (
                                  <button
                                    onClick={() => setVoidConfirmId(activeWinner.id)}
                                    disabled={!!busy}
                                    className="ml-auto text-[10px] text-gray-400 hover:text-red-500 hover:bg-red-50 px-2 py-0.5 rounded-lg transition-colors disabled:opacity-40"
                                  >
                                    Anular
                                  </button>
                                )}
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

            {/* ── Stats + participantes ────────────────────────────────────── */}
            <div className="grid grid-cols-2 gap-2">
              {/* Tickets en ánfora */}
              <div className="bg-gray-50 rounded-xl px-4 py-3.5">
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

              {/* Participantes → abre modal */}
              <button
                onClick={() => setShowParticipants(true)}
                className="bg-gray-50 hover:bg-gray-100 rounded-xl px-4 py-3.5 text-left group transition-colors"
              >
                <p className="text-[11px] text-gray-400 font-medium mb-1">
                  {isSpending ? 'Clientes' : 'Participantes'}
                </p>
                <div className="flex items-end justify-between">
                  <span className="font-heading font-black text-3xl text-gray-900 leading-none">
                    {participantCount}
                  </span>
                  <svg className="w-5 h-5 text-gray-300 group-hover:text-gray-500 transition-colors mb-0.5"
                    fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </div>
                <p className="text-[10px] text-gray-400 mt-1.5 group-hover:text-violet-500 transition-colors">
                  Ver detalle →
                </p>
              </button>
            </div>

            {/* ── Acciones ─────────────────────────────────────────────────── */}
            {(isActive || isReopenable || isDrawable || isDeletable) && (
              <div className="pt-1 border-t border-gray-100 space-y-2">
                {/* Botón principal de sorteo */}
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

                {/* Acciones secundarias */}
                <div className="flex items-center gap-2">
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
                  {isDeletable && (
                    <button
                      onClick={handleDelete}
                      disabled={!!busy}
                      className="ml-auto text-xs text-gray-400 hover:text-red-500 disabled:opacity-40 transition-colors px-2 py-1.5 rounded-lg hover:bg-red-50"
                    >
                      Eliminar sorteo
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

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
        <DrawingModal
          position={drawingPosition}
          names={availableTickets.map((t) => t.customer.name)}
          revealName={pendingWinnerName}
        />
      )}

      {drawnWinner && raffle && (
        <WinnerModal raffleName={raffle.name} winner={drawnWinner} onClose={() => setDrawnWinner(null)} />
      )}

      {showParticipants && raffle && (
        <ParticipantsModal raffle={raffle} onClose={() => setShowParticipants(false)} />
      )}
    </>
  );
}
