import { useState, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { rafflesApi } from '../api/raffles.api';
import { handleApiError } from '../utils/api-error';
import type { RaffleWinnerDto } from '@pos/shared';
import type { DetailRaffle } from '../components/raffles/types';
import { useSocketEvent } from '../context/socket.context';
import { queryKeys } from '../lib/query-keys';

export const DRAW_DURATION_MS = 7000;
export const WINNER_PAUSE_MS  = 4000;

export type BusyState = 'draw' | 'close' | 'reopen' | 'delete' | `void-${string}` | null;

export function useRaffleDetail(
  raffleId: string,
  onClose:  () => void,
  onUpdate: () => void,
) {
  const queryClient = useQueryClient();

  const [busy, setBusy]                           = useState<BusyState>(null);
  const [showConfirm, setShowConfirm]             = useState(false);
  const [deleteConfirm, setDeleteConfirm]         = useState(false);
  const [deleted, setDeleted]                     = useState(false);
  const [drawingPosition, setDrawingPosition]     = useState<number | null>(null);
  const [pendingWinnerName, setPendingWinnerName] = useState<string | null>(null);
  const [drawnWinner, setDrawnWinner]             = useState<RaffleWinnerDto | null>(null);
  const [voidConfirmId, setVoidConfirmId]         = useState<string | null>(null);

  const qk = queryKeys.raffleDetail(raffleId);

  const { data: raffle, isPending: loading, isError: error, refetch } = useQuery<DetailRaffle>({
    queryKey: qk,
    queryFn:  () => rafflesApi.getOne(raffleId),
    staleTime: 0,
  });

  const invalidate = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: qk });
  }, [queryClient, raffleId]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleTicketAdded = useCallback((data: { raffleId: string }) => {
    if (data.raffleId === raffleId) invalidate();
  }, [raffleId, invalidate]);

  useSocketEvent<{ raffleId: string }>('raffle.ticket_added', handleTicketAdded);

  // Mutations update cache directly with server response, no extra refetch needed
  function setRaffle(updated: DetailRaffle) {
    queryClient.setQueryData(qk, updated);
  }

  async function handleClose() {
    if (!raffle) return;
    setBusy('close');
    try {
      const updated = await rafflesApi.close(raffle.id);
      setRaffle(updated);
      onUpdate();
    } catch (err) { handleApiError(err, 'Error al cerrar sorteo'); }
    finally { setBusy(null); }
  }

  async function handleReopen() {
    if (!raffle) return;
    setBusy('reopen');
    try {
      const updated = await rafflesApi.reopen(raffle.id);
      setRaffle(updated);
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
    if (!raffle || deleted) return;
    setDeleteConfirm(false);
    setBusy('delete');
    try {
      await rafflesApi.delete(raffle.id);
      setDeleted(true);
      onUpdate();
      onClose();
    } catch (err) {
      handleApiError(err, 'Error al eliminar sorteo');
      setBusy(null);
    }
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
    raffle:      raffle ?? null,
    setRaffle,
    loading,
    error,
    busy,
    deleted,
    showConfirm,    setShowConfirm,
    deleteConfirm,  setDeleteConfirm,
    drawingPosition,
    pendingWinnerName,
    drawnWinner,    setDrawnWinner,
    voidConfirmId,  setVoidConfirmId,
    handleClose, handleReopen, handleVoidWinner, handleDelete, handleDraw,
    reload:     refetch,
    isDrawable, isDeletable, isActive, isReopenable, canVoid,
    availableTickets,
    activeWinnersCount,
  };
}
