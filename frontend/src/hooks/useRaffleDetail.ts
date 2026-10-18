import { useState, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { rafflesApi } from '../api/raffles.api';
import { handleApiError } from '../utils/api-error';
import type { RaffleTicketsRevokedPayload, RaffleWinnerDto } from '@pos/shared';
import { SOCKET_EVENTS } from '@pos/shared';
import type { DetailRaffle } from '../components/raffles/types';
import { useSocketEvent } from '../context/socket.context';
import { queryKeys } from '../lib/query-keys';
import { formatTicketRanges } from '../utils/raffle-utils';

type BusyState = 'register' | 'close' | 'reopen' | 'delete' | `void-${string}` | null;

export function useRaffleDetail(
  raffleId: string,
  onClose:  () => void,
) {
  const queryClient = useQueryClient();

  const [busy, setBusy]                           = useState<BusyState>(null);
  const [registerOpen, setRegisterOpen]           = useState(false);
  const [deleteConfirm, setDeleteConfirm]         = useState(false);
  const [deleted, setDeleted]                     = useState(false);
  const [drawnWinner, setDrawnWinner]             = useState<RaffleWinnerDto | null>(null);
  const [voidConfirmId, setVoidConfirmId]         = useState<string | null>(null);

  const qk = queryKeys.raffleDetail(raffleId);

  const { data: raffle, isPending: loading, isError: error, refetch } = useQuery<DetailRaffle>({
    queryKey: qk,
    queryFn:  () => rafflesApi.getOne(raffleId),
  });

  const invalidate = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: qk });
  }, [queryClient, raffleId]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleTicketAdded = useCallback((data: { raffleId: string }) => {
    if (data.raffleId === raffleId) invalidate();
  }, [raffleId, invalidate]);

  const handleTicketsRevoked = useCallback((data: RaffleTicketsRevokedPayload) => {
    if (data.raffleId !== raffleId) return;
    invalidate();
    if (data.printedTicketNumbers.length > 0) {
      toast.error(`Un cambio en un pedido anuló tickets que ya estaban en el ánfora. Sácalos: ${formatTicketRanges(data.printedTicketNumbers)}`, { duration: 15000 });
    }
  }, [raffleId, invalidate]);

  const handlePrintChanged = useCallback((data: { raffleId: string }) => {
    if (data.raffleId === raffleId) invalidate();
  }, [raffleId, invalidate]);

  // Otra sesión eliminó este sorteo: lo que se ve ya no existe (las acciones propias lo marcan en `deleted`).
  const handleRaffleDeleted = useCallback((data: { id: string }) => {
    if (data.id !== raffleId || deleted) return;
    toast.error('Este sorteo fue eliminado');
    onClose();
  }, [raffleId, deleted, onClose]);

  const handleRaffleUpdated = useCallback((updated: DetailRaffle) => {
    if (updated?.id === raffleId) {
      queryClient.setQueryData(qk, updated);
    }
  }, [raffleId, queryClient]); // eslint-disable-line react-hooks/exhaustive-deps

  useSocketEvent<{ raffleId: string }>(SOCKET_EVENTS.RAFFLE_TICKET_ADDED, handleTicketAdded);
  useSocketEvent<RaffleTicketsRevokedPayload>(SOCKET_EVENTS.RAFFLE_TICKETS_REVOKED, handleTicketsRevoked);
  useSocketEvent<{ raffleId: string }>(SOCKET_EVENTS.RAFFLE_PRINT_CHANGED, handlePrintChanged);
  useSocketEvent<DetailRaffle>(SOCKET_EVENTS.RAFFLE_UPDATED, handleRaffleUpdated);
  useSocketEvent<{ id: string }>(SOCKET_EVENTS.RAFFLE_DELETED, handleRaffleDeleted);

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
    } catch (err) { handleApiError(err, 'Error al cerrar sorteo'); }
    finally { setBusy(null); }
  }

  async function handleReopen() {
    if (!raffle) return;
    setBusy('reopen');
    try {
      const updated = await rafflesApi.reopen(raffle.id);
      setRaffle(updated);
    } catch (err) { handleApiError(err, 'Error al reabrir sorteo'); }
    finally { setBusy(null); }
  }

  async function handleVoidWinner(winnerId: string, reason: string) {
    if (!raffle) return;
    setBusy(`void-${winnerId}`);
    setVoidConfirmId(null);
    try {
      const updated = await rafflesApi.voidWinner(raffle.id, winnerId, { reason });
      setRaffle(updated);
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
      onClose();
    } catch (err) {
      handleApiError(err, 'Error al eliminar sorteo');
      setBusy(null);
    }
  }

  /** Registra al dueño del ticket que salió del ánfora para el puesto que toca. */
  async function handleRegisterWinner(ticketNumber: number) {
    if (!raffle || raffle.nextPositionToDraw === null) return;
    const position = raffle.nextPositionToDraw;
    setBusy('register');
    try {
      const updated = await rafflesApi.registerWinner(raffle.id, ticketNumber);
      setRaffle(updated);
      setRegisterOpen(false);
      setDrawnWinner(updated.winners.find((w) => w.position === position && !w.voided) ?? null);
    } catch (err) {
      handleApiError(err, 'Error al registrar el ganador');
    } finally {
      setBusy(null);
    }
  }

  // Los ganadores se registran con el sorteo cerrado: con el ánfora abierta seguirían entrando tickets.
  
  const isDrawable   = raffle?.status === 'CLOSED' || raffle?.status === 'DRAWING';
  const isActive     = raffle?.status === 'ACTIVE';
  const isReopenable = raffle?.status === 'CLOSED';
  const canVoid      = raffle?.status === 'DRAWING' || raffle?.status === 'DRAWN';

  const activeWinnersCount = raffle?.winners.filter((w) => !w.voided).length ?? 0;

  return {
    raffle:      raffle ?? null,
    setRaffle,
    loading,
    error,
    busy,
    deleted,
    registerOpen,   setRegisterOpen,
    deleteConfirm,  setDeleteConfirm,
    drawnWinner,    setDrawnWinner,
    voidConfirmId,  setVoidConfirmId,
    handleClose, handleReopen, handleVoidWinner, handleDelete, handleRegisterWinner,
    reload:     refetch,
    isDrawable, isActive, isReopenable, canVoid,
    activeWinnersCount,
  };
}
