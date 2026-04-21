import { useState, useEffect, useCallback } from 'react';
import { rafflesApi } from '../../api/raffles.api';
import { handleApiError } from '../../utils/api-error';
import type { RaffleWinnerDto } from '@pos/shared';
import type { DetailRaffle } from './types';

export const DRAW_DURATION_MS = 7000;
export const WINNER_PAUSE_MS  = 2500;

export function useRaffleDetail(
  raffleId: string,
  onClose: () => void,
  onUpdate: () => void,
) {
  const [raffle, setRaffle] = useState<DetailRaffle | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [drawingPosition, setDrawingPosition] = useState<number | null>(null);
  const [pendingWinnerName, setPendingWinnerName] = useState<string | null>(null);
  const [drawnWinner, setDrawnWinner] = useState<RaffleWinnerDto | null>(null);
  const [voidConfirmId, setVoidConfirmId] = useState<string | null>(null);

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

  async function handleVoidWinner(winnerId: string) {
    if (!raffle) return;
    setBusy(`void-${winnerId}`);
    setVoidConfirmId(null);
    try {
      const updated = await rafflesApi.voidWinner(raffle.id, winnerId);
      setRaffle(updated);
      onUpdate();
    } catch (err) { handleApiError(err, 'Error al anular ganador'); }
    finally { setBusy(null); }
  }

  async function handleDelete() {
    if (!raffle) return;
    if (!window.confirm(`¿Eliminar el sorteo "${raffle.name}"? Se eliminarán todos los tickets acumulados.`)) return;
    setBusy('delete');
    try {
      await rafflesApi.delete(raffle.id);
      onUpdate();
      onClose();
    } catch (err) { handleApiError(err, 'Error al eliminar sorteo'); }
    finally { setBusy(null); }
  }

  async function handleDraw() {
    if (!raffle || raffle.nextPositionToDraw === null) return;
    const positionBeingDrawn = raffle.nextPositionToDraw;
    setShowConfirm(false);
    setDrawingPosition(positionBeingDrawn);
    setPendingWinnerName(null);
    setBusy('draw');
    try {
      const [updated] = await Promise.all([
        rafflesApi.draw(raffle.id),
        new Promise<void>((r) => setTimeout(r, DRAW_DURATION_MS)),
      ]);
      const justDrawn = updated.winners.find((w) => w.position === positionBeingDrawn && !w.voided) ?? null;
      if (justDrawn) setPendingWinnerName(justDrawn.customer.name);
      await new Promise<void>((r) => setTimeout(r, WINNER_PAUSE_MS));
      setDrawingPosition(null);
      setPendingWinnerName(null);
      setRaffle(updated);
      onUpdate();
      if (justDrawn) setDrawnWinner(justDrawn);
    } catch (err) {
      setDrawingPosition(null);
      setPendingWinnerName(null);
      handleApiError(err, 'Error al sortear');
    } finally {
      setBusy(null);
    }
  }

  const isDrawable   = raffle?.status === 'ACTIVE' || raffle?.status === 'CLOSED' || raffle?.status === 'DRAWING';
  const isDeletable  = raffle?.status !== 'DRAWN' && raffle?.status !== 'DRAWING';
  const isActive     = raffle?.status === 'ACTIVE';
  const isReopenable = raffle?.status === 'CLOSED';
  const canVoid      = raffle?.status === 'DRAWING' || raffle?.status === 'DRAWN';

  const activeWinnerTicketIds = new Set(raffle?.winners.filter((w) => !w.voided).map((w) => w.ticketId) ?? []);
  const availableTickets      = raffle?.tickets.filter((t) => !activeWinnerTicketIds.has(t.id)) ?? [];
  const activeWinnersCount    = raffle?.winners.filter((w) => !w.voided).length ?? 0;

  return {
    raffle,
    loading,
    busy,
    showConfirm,
    setShowConfirm,
    drawingPosition,
    pendingWinnerName,
    drawnWinner,
    setDrawnWinner,
    voidConfirmId,
    setVoidConfirmId,
    handleClose,
    handleReopen,
    handleVoidWinner,
    handleDelete,
    handleDraw,
    isDrawable,
    isDeletable,
    isActive,
    isReopenable,
    canVoid,
    availableTickets,
    activeWinnersCount,
  };
}
