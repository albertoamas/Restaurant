import React, { useState, useEffect } from 'react';
import { playDrawTick } from '../../utils/raffle-sounds';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Spinner } from '../ui/Spinner';
import type { RaffleStatus } from '@pos/shared';
import { StatusBadge } from './StatusBadge';
import { IconTicket, IconPackage, IconGift, IconAward, IconStar, IconDice } from './RaffleIcons';
import { WinnerModal } from './WinnerModal';
import { useRaffleDetail, DRAW_DURATION_MS } from './useRaffleDetail';

function positionLabel(position: number): string {
  if (position === 1) return '1er lugar';
  if (position === 2) return '2do lugar';
  if (position === 3) return '3er lugar';
  return `${position}° lugar`;
}

function ConfirmDrawModal({
  nextPosition,
  raffleName,
  availableTickets,
  onConfirm,
  onCancel,
  loading,
}: {
  nextPosition: number;
  raffleName: string;
  availableTickets: number;
  onConfirm: () => void;
  onCancel: () => void;
  loading: boolean;
}) {
  return (
    <Modal isOpen onClose={onCancel} title={`Sortear ${positionLabel(nextPosition)}`} size="sm">
      <div className="space-y-4">
        <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
          <p className="text-sm font-semibold text-amber-900 mb-1.5">Esta acción no se puede deshacer</p>
          <p className="text-xs text-amber-700 leading-relaxed">
            Se sorteará el <strong className="font-bold">{positionLabel(nextPosition)}</strong> del sorteo{' '}
            <strong className="font-bold">"{raffleName}"</strong> entre los{' '}
            <strong className="font-bold">{availableTickets} tickets disponibles</strong> en el ánfora.
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

function DrawingModal({ position, names }: { position: number; names: string[] }) {
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

      if (progress < 0.97) {
        setTimeout(spin, delay);
      } else {
        setPhase('stopped');
      }
    };

    const id = setTimeout(spin, 85);
    return () => { cancelled = true; clearTimeout(id); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Modal isOpen onClose={() => {}} title="" size="sm">
      <div className="text-center pb-6 pt-4 px-2 select-none">
        <p className="text-[10px] font-black uppercase tracking-[0.25em] text-violet-500 mb-1">
          Sorteando
        </p>
        <p className="text-base font-black font-heading text-gray-900 mb-5">
          {positionLabel(position)}
        </p>

        <div className="relative w-20 h-20 mx-auto mb-5">
          <div className="absolute inset-0 rounded-full border-4 border-violet-100" />
          <div className="absolute inset-0 rounded-full border-[3px] border-transparent border-t-violet-500 animate-spin" />
          <div
            className="absolute inset-1.5 rounded-full border-2 border-transparent border-b-violet-300 animate-spin"
            style={{ animationDirection: 'reverse', animationDuration: '0.5s' }}
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <IconDice className="w-6 h-6 text-violet-400" />
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-[300px] overflow-hidden" style={{ height: '160px' }}>
          <div className="absolute inset-x-0 top-0 h-10 bg-gradient-to-b from-white to-transparent z-10 pointer-events-none" />
          <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-white to-transparent z-10 pointer-events-none" />
          <div className="absolute inset-x-0 top-0 flex items-center justify-center h-8">
            <span className="text-xs font-medium text-gray-200 truncate px-4">
              {pool[(idx - 2 + pool.length) % pool.length]}
            </span>
          </div>
          <div className="absolute inset-x-0 top-8 flex items-center justify-center h-9">
            <span className="text-sm font-semibold text-gray-300 truncate px-4">
              {pool[(idx - 1 + pool.length) % pool.length]}
            </span>
          </div>
          <div className={`absolute inset-x-0 top-[68px] flex items-center justify-center h-[42px] rounded-2xl mx-2 transition-colors duration-200 ${
            phase === 'stopped' ? 'bg-violet-50 border-2 border-violet-200' : 'bg-gray-50'
          }`}>
            <span className={`font-black font-heading truncate px-4 transition-all duration-100 ${
              phase === 'stopped' ? 'text-violet-700 text-xl' : 'text-gray-900 text-lg'
            }`}>
              {pool[idx]}
            </span>
          </div>
          <div className="absolute inset-x-0 top-[110px] flex items-center justify-center h-9">
            <span className="text-sm font-semibold text-gray-300 truncate px-4">
              {pool[(idx + 1) % pool.length]}
            </span>
          </div>
          <div className="absolute inset-x-0 top-[149px] flex items-center justify-center h-8">
            <span className="text-xs font-medium text-gray-200 truncate px-4">
              {pool[(idx + 2) % pool.length]}
            </span>
          </div>
        </div>

        <div className="mt-5 flex justify-center gap-1.5">
          {phase !== 'stopped' ? (
            [0, 1, 2].map((i) => (
              <span
                key={i}
                className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-bounce"
                style={{ animationDelay: `${i * 160}ms` }}
              />
            ))
          ) : (
            <span className="text-xs font-semibold text-violet-500 animate-pulse">
              Calculando resultado…
            </span>
          )}
        </div>
      </div>
    </Modal>
  );
}

export function RaffleDetailModal({
  raffleId,
  onClose,
  onUpdate,
}: {
  raffleId: string;
  onClose: () => void;
  onUpdate: () => void;
}) {
  const {
    raffle, loading, busy,
    showConfirm, setShowConfirm,
    isDrawing,
    drawnWinner, setDrawnWinner,
    voidConfirmId, setVoidConfirmId,
    handleClose, handleReopen, handleVoidWinner, handleDelete, handleDraw,
    isDrawable, isDeletable, isActive, isReopenable, canVoid,
    availableTickets, activeWinnersCount,
  } = useRaffleDetail(raffleId, onClose, onUpdate);

  return (
    <>
      <Modal isOpen onClose={onClose} title={raffle?.name ?? 'Sorteo'} size="lg">
        {loading || !raffle ? (
          <div className="flex justify-center py-12"><Spinner /></div>
        ) : (
          <div className="space-y-4">
            {/* Header: estado + producto */}
            <div className="flex items-center gap-2 flex-wrap">
              <StatusBadge status={raffle.status as RaffleStatus} />
              {raffle.productName && (
                <span className="inline-flex items-center gap-1 text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                  <IconPackage className="w-3 h-3 text-gray-400" />
                  {raffle.productName}
                </span>
              )}
              <span className="inline-flex items-center gap-1 text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full ml-auto">
                {activeWinnersCount}/{raffle.numberOfWinners} sorteados
              </span>
            </div>

            {raffle.description && (
              <p className="text-sm text-gray-500 leading-relaxed">{raffle.description}</p>
            )}

            {/* Premios */}
            {raffle.prizes.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Premios</p>
                <div className="space-y-1.5">
                  {raffle.prizes.map((p) => {
                    const activeWinner = raffle.winners.find((w) => w.position === p.position && !w.voided);
                    const voidedWinner = raffle.winners.find((w) => w.position === p.position && w.voided);
                    const isConfirming = voidConfirmId === activeWinner?.id;
                    return (
                      <div key={p.position} className={`flex items-center gap-3 rounded-xl px-3 py-2.5 ${
                        activeWinner ? 'bg-amber-50 border border-amber-100' : 'bg-gray-50'
                      }`}>
                        <span className="text-[11px] font-bold text-gray-400 w-10 shrink-0">
                          {positionLabel(p.position)}
                        </span>
                        <div className="flex items-center gap-1.5 flex-1 min-w-0">
                          <IconGift className="w-3 h-3 text-gray-400 shrink-0" />
                          <span className="text-xs text-gray-700 truncate">{p.prizeDescription}</span>
                        </div>
                        {voidedWinner && !activeWinner && (
                          <span className="text-[10px] text-red-400 line-through truncate shrink-0 max-w-[80px]">
                            {voidedWinner.customer.name}
                          </span>
                        )}
                        {activeWinner && !isConfirming && (
                          <div className="flex items-center gap-1.5 shrink-0">
                            <IconAward className="w-3.5 h-3.5 text-amber-600" />
                            <span className="text-xs font-semibold text-amber-800">{activeWinner.customer.name}</span>
                            {canVoid && (
                              <button
                                onClick={() => setVoidConfirmId(activeWinner.id)}
                                disabled={!!busy}
                                className="ml-1 text-[10px] text-gray-400 hover:text-red-500 hover:bg-red-50 px-1.5 py-0.5 rounded transition-colors"
                              >
                                Anular
                              </button>
                            )}
                          </div>
                        )}
                        {isConfirming && (
                          <div className="flex items-center gap-1.5 shrink-0">
                            <span className="text-[10px] text-red-600 font-semibold">¿Confirmar?</span>
                            <button
                              onClick={() => handleVoidWinner(activeWinner!.id)}
                              disabled={!!busy}
                              className="text-[10px] font-bold text-white bg-red-500 hover:bg-red-600 px-2 py-0.5 rounded transition-colors disabled:opacity-50"
                            >
                              Sí
                            </button>
                            <button
                              onClick={() => setVoidConfirmId(null)}
                              className="text-[10px] text-gray-500 hover:text-gray-700 px-1.5 py-0.5 rounded transition-colors"
                            >
                              No
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {isActive && raffle.productName && (
              <div className="flex items-start gap-2.5 bg-gray-50 border border-gray-100 rounded-xl px-3.5 py-3">
                <IconTicket className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                <p className="text-xs text-gray-500 leading-relaxed">
                  Los tickets se generan automáticamente al registrar pedidos con{' '}
                  <strong className="text-gray-700 font-semibold">{raffle.productName}</strong> y un cliente asignado.
                </p>
              </div>
            )}

            {/* Contador de tickets */}
            <div className="bg-gray-50 rounded-xl px-4 py-3 flex items-center justify-between">
              <span className="text-sm text-gray-500">Tickets en el ánfora</span>
              <span className="font-heading font-black text-2xl text-gray-900">
                {availableTickets.length}
                {raffle.ticketCount !== availableTickets.length && (
                  <span className="text-sm font-normal text-gray-400 ml-1">/ {raffle.ticketCount} total</span>
                )}
              </span>
            </div>

            {/* Participantes */}
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Participantes</p>
              {raffle.tickets.length === 0 ? (
                <div className="text-center py-8 text-gray-400 text-sm border border-dashed border-gray-200 rounded-xl">
                  Sin tickets aún
                </div>
              ) : (
                <div className="space-y-1 max-h-52 overflow-y-auto pr-0.5">
                  {raffle.tickets.map((t) => {
                    const win = raffle.winners.find((w) => w.ticketId === t.id && !w.voided);
                    return (
                      <div
                        key={t.id}
                        className={`flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors ${
                          win ? 'bg-amber-50 border border-amber-100' : 'bg-gray-50'
                        }`}
                      >
                        <span className={`text-[11px] font-mono font-bold shrink-0 w-8 text-center ${
                          win ? 'text-amber-700' : 'text-gray-400'
                        }`}>
                          #{t.ticketNumber}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-medium truncate ${win ? 'text-amber-900' : 'text-gray-800'}`}>
                            {t.customer.name}
                          </p>
                          {t.customer.phone && (
                            <p className="text-xs text-gray-400">{t.customer.phone}</p>
                          )}
                        </div>
                        {win && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full shrink-0 uppercase tracking-wide">
                            <IconStar className="w-2.5 h-2.5" />
                            {positionLabel(win.position)}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Acciones */}
            {(isActive || isDrawable || isDeletable) && (
              <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-gray-100">
                {isActive && (
                  <Button variant="secondary" size="sm" onClick={handleClose} loading={busy === 'close'} disabled={!!busy}>
                    Cerrar sorteo
                  </Button>
                )}
                {isReopenable && (
                  <Button variant="secondary" size="sm" onClick={handleReopen} loading={busy === 'reopen'} disabled={!!busy}>
                    Reabrir sorteo
                  </Button>
                )}
                {isDrawable && raffle.nextPositionToDraw !== null && (
                  <div className="flex-1">
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
                  </div>
                )}
                {isDeletable && (
                  <button
                    onClick={handleDelete}
                    disabled={!!busy}
                    className="text-xs text-gray-400 hover:text-red-500 disabled:opacity-40 transition-colors px-2 py-1.5 rounded-lg hover:bg-red-50 ml-auto"
                  >
                    Eliminar sorteo
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </Modal>

      {showConfirm && raffle && raffle.nextPositionToDraw !== null && (
        <ConfirmDrawModal
          nextPosition={raffle.nextPositionToDraw}
          raffleName={raffle.name}
          availableTickets={availableTickets.length}
          onConfirm={handleDraw}
          onCancel={() => setShowConfirm(false)}
          loading={busy === 'draw'}
        />
      )}

      {isDrawing && raffle?.nextPositionToDraw !== null && raffle && (
        <DrawingModal
          position={raffle.nextPositionToDraw!}
          names={availableTickets.map((t) => t.customer.name)}
        />
      )}

      {drawnWinner && raffle && (
        <WinnerModal
          raffleName={raffle.name}
          winner={drawnWinner}
          onClose={() => setDrawnWinner(null)}
        />
      )}
    </>
  );
}
