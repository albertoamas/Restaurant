import { useState, useEffect, useCallback } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Spinner } from '../ui/Spinner';
import { rafflesApi } from '../../api/raffles.api';
import { handleApiError } from '../../utils/api-error';
import type { RaffleStatus } from '@pos/shared';
import type { DetailRaffle } from './types';
import { StatusBadge } from './StatusBadge';
import { IconTicket, IconPackage, IconGift, IconAward, IconStar, IconDice } from './RaffleIcons';

function ConfirmDrawModal({
  raffle,
  onConfirm,
  onCancel,
  loading,
}: {
  raffle: DetailRaffle;
  onConfirm: () => void;
  onCancel: () => void;
  loading: boolean;
}) {
  return (
    <Modal isOpen onClose={onCancel} title="Confirmar sorteo" size="sm">
      <div className="space-y-4">
        <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
          <p className="text-sm font-semibold text-amber-900 mb-1.5">Esta acción no se puede deshacer</p>
          <p className="text-xs text-amber-700 leading-relaxed">
            Se sorteará un ganador entre los{' '}
            <strong className="font-bold">{raffle.ticketCount} tickets</strong> del sorteo{' '}
            <strong className="font-bold">"{raffle.name}"</strong>.
            Una vez realizado, el resultado es definitivo.
          </p>
        </div>
        <div className="flex gap-2 pt-1">
          <Button variant="secondary" onClick={onCancel} disabled={loading}>Cancelar</Button>
          <Button variant="primary" fullWidth onClick={onConfirm} loading={loading}>
            <span className="flex items-center justify-center gap-2">
              <IconDice className="w-4 h-4" />
              Sí, sortear ahora
            </span>
          </Button>
        </div>
      </div>
    </Modal>
  );
}

function DrawingModal() {
  const [displayNum, setDisplayNum] = useState(() => Math.floor(Math.random() * 999) + 1);

  useEffect(() => {
    const id = setInterval(() => setDisplayNum(Math.floor(Math.random() * 999) + 1), 75);
    return () => clearInterval(id);
  }, []);

  return (
    <Modal isOpen onClose={() => {}} title="" size="sm">
      <div className="text-center py-10 px-4">
        <div className="relative w-32 h-32 mx-auto mb-6">
          <div className="absolute inset-0 rounded-full border-4 border-indigo-100" />
          <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-indigo-500 animate-spin" />
          <div className="absolute inset-2 rounded-full border-2 border-transparent border-b-indigo-300 animate-spin"
            style={{ animationDirection: 'reverse', animationDuration: '0.6s' }} />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="font-mono font-black text-2xl text-indigo-600 tabular-nums">
              #{String(displayNum).padStart(3, '0')}
            </span>
          </div>
        </div>
        <p className="text-lg font-black font-heading text-gray-800 tracking-wide mb-1">Sorteando...</p>
        <p className="text-xs text-gray-400 mb-4">Seleccionando el ticket ganador</p>
        <div className="flex justify-center gap-1.5">
          {[0, 1, 2].map((i) => (
            <span key={i} className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce"
              style={{ animationDelay: `${i * 160}ms` }} />
          ))}
        </div>
      </div>
    </Modal>
  );
}

export function RaffleDetailModal({
  raffleId,
  onClose,
  onUpdate,
  onDraw,
}: {
  raffleId: string;
  onClose: () => void;
  onUpdate: () => void;
  onDraw: (r: DetailRaffle) => void;
}) {
  const [raffle, setRaffle] = useState<DetailRaffle | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);

  const reload = useCallback(async () => {
    try {
      setRaffle(await rafflesApi.getOne(raffleId));
    } catch (err) {
      handleApiError(err, 'Error al cargar sorteo');
    } finally {
      setLoading(false);
    }
  }, [raffleId]);

  useEffect(() => { reload(); }, [reload]);

  async function handleClose() {
    if (!raffle) return;
    setBusy('close');
    try {
      const updated = await rafflesApi.close(raffle.id);
      setRaffle({ ...updated, tickets: raffle.tickets });
      onUpdate();
    } catch (err) { handleApiError(err, 'Error al cerrar sorteo'); }
    finally { setBusy(null); }
  }

  async function handleReopen() {
    if (!raffle) return;
    setBusy('reopen');
    try {
      const updated = await rafflesApi.reopen(raffle.id);
      setRaffle({ ...updated, tickets: raffle.tickets });
      onUpdate();
    } catch (err) { handleApiError(err, 'Error al reabrir sorteo'); }
    finally { setBusy(null); }
  }

  async function handleDelete() {
    if (!raffle) return;
    if (!window.confirm(`¿Eliminar el sorteo "${raffle.name}"? Se eliminarán todos los tickets acumulados y no se podrá deshacer.`)) return;
    setBusy('delete');
    try {
      await rafflesApi.delete(raffle.id);
      onUpdate();
      onClose();
    } catch (err) { handleApiError(err, 'Error al eliminar sorteo'); }
    finally { setBusy(null); }
  }

  async function handleDraw() {
    if (!raffle) return;
    setShowConfirm(false);
    setIsDrawing(true);
    setBusy('draw');
    try {
      const [updated] = await Promise.all([
        rafflesApi.draw(raffle.id),
        new Promise<void>((r) => setTimeout(r, 2800)),
      ]);
      setIsDrawing(false);
      onUpdate();
      onDraw(updated);
      onClose();
    } catch (err) {
      setIsDrawing(false);
      handleApiError(err, 'Error al sortear');
    } finally {
      setBusy(null);
    }
  }

  const isActive     = raffle?.status === 'ACTIVE';
  const isDrawable   = raffle?.status === 'ACTIVE' || raffle?.status === 'CLOSED';
  const isDeletable  = raffle?.status !== 'DRAWN';
  const isReopenable = raffle?.status === 'CLOSED';

  return (
    <>
      <Modal isOpen onClose={onClose} title={raffle?.name ?? 'Sorteo'} size="lg">
        {loading || !raffle ? (
          <div className="flex justify-center py-12"><Spinner /></div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-2 flex-wrap">
              <StatusBadge status={raffle.status as RaffleStatus} />
              {raffle.productName && (
                <span className="inline-flex items-center gap-1 text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                  <IconPackage className="w-3 h-3 text-gray-400" />
                  {raffle.productName}
                </span>
              )}
              {raffle.prizeDescription && (
                <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                  <IconGift className="w-3 h-3 text-gray-400" />
                  {raffle.prizeDescription}
                </span>
              )}
            </div>

            {raffle.description && (
              <p className="text-sm text-gray-500 leading-relaxed">{raffle.description}</p>
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

            <div className="bg-gray-50 rounded-xl px-4 py-3 flex items-center justify-between">
              <span className="text-sm text-gray-500">Total de tickets</span>
              <span className="font-heading font-black text-2xl text-gray-900">{raffle.ticketCount}</span>
            </div>

            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Participantes</p>
              {raffle.tickets.length === 0 ? (
                <div className="text-center py-8 text-gray-400 text-sm border border-dashed border-gray-200 rounded-xl">
                  Sin tickets aún
                </div>
              ) : (
                <div className="space-y-1 max-h-60 overflow-y-auto pr-0.5">
                  {raffle.tickets.map((t) => {
                    const isWinner = t.id === raffle.winnerTicketId;
                    return (
                      <div key={t.id} className={`flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors ${
                        isWinner ? 'bg-amber-50 border border-amber-100' : 'bg-gray-50'
                      }`}>
                        <span className={`text-[11px] font-mono font-bold shrink-0 w-8 text-center ${
                          isWinner ? 'text-amber-700' : 'text-gray-400'
                        }`}>
                          #{t.ticketNumber}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-medium truncate ${isWinner ? 'text-amber-900' : 'text-gray-800'}`}>
                            {t.customer.name}
                          </p>
                          {t.customer.phone && (
                            <p className="text-xs text-gray-400">{t.customer.phone}</p>
                          )}
                        </div>
                        {isWinner && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full shrink-0 uppercase tracking-wide">
                            <IconStar className="w-2.5 h-2.5" />
                            Ganador
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

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
                {isDrawable && (
                  <div className="flex-1">
                    <Button variant="primary" fullWidth onClick={() => setShowConfirm(true)}
                      disabled={!!busy || raffle.ticketCount === 0}>
                      <span className="flex items-center justify-center gap-2">
                        <IconDice className="w-4 h-4" />
                        Sortear ganador
                      </span>
                    </Button>
                  </div>
                )}
                {isDeletable && (
                  <button onClick={handleDelete} disabled={!!busy}
                    className="text-xs text-gray-400 hover:text-red-500 disabled:opacity-40 transition-colors px-2 py-1.5 rounded-lg hover:bg-red-50 ml-auto">
                    Eliminar sorteo
                  </button>
                )}
              </div>
            )}

            {raffle.status === 'DRAWN' && raffle.winnerCustomer && (
              <div className="flex items-center gap-3 bg-amber-50 border border-amber-100 rounded-xl px-4 py-3">
                <IconAward className="w-5 h-5 text-amber-600 shrink-0" />
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wide text-amber-600 mb-0.5">Ganador</p>
                  <p className="text-sm font-semibold text-amber-900">{raffle.winnerCustomer.name}</p>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      {showConfirm && raffle && (
        <ConfirmDrawModal
          raffle={raffle}
          onConfirm={handleDraw}
          onCancel={() => setShowConfirm(false)}
          loading={busy === 'draw'}
        />
      )}

      {isDrawing && <DrawingModal />}
    </>
  );
}
