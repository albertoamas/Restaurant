import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Confetti } from '../ui/Confetti';
import type { DetailRaffle } from './types';
import { IconAward, IconTicket } from './RaffleIcons';

export function WinnerModal({ raffle, onClose }: { raffle: DetailRaffle; onClose: () => void }) {
  const winnerTicket = raffle.tickets.find((t) => t.id === raffle.winnerTicketId);

  return (
    <>
      <Confetti active />
      <Modal isOpen onClose={onClose} title="" size="sm">
        <div className="text-center px-2 pb-2">
          <div className="flex items-center justify-center mx-auto mb-5">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-amber-100 to-amber-200 border-4 border-amber-300/60 flex items-center justify-center shadow-[0_0_0_8px_oklch(0.92_0.10_80/0.20)]">
              <IconAward className="w-9 h-9 text-amber-600" />
            </div>
          </div>

          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-amber-600 mb-2">
            Ganador del sorteo
          </p>

          <p className="text-3xl font-heading font-black text-gray-900 leading-tight mb-1">
            {raffle.winnerCustomer?.name ?? '—'}
          </p>

          {raffle.winnerCustomer?.phone && (
            <p className="text-sm text-gray-400 mb-4">{raffle.winnerCustomer.phone}</p>
          )}

          {winnerTicket && (
            <div className="inline-flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 mb-4">
              <IconTicket className="w-4 h-4 text-gray-400" />
              <span className="text-sm font-mono font-bold text-gray-700">
                Ticket #{winnerTicket.ticketNumber}
              </span>
            </div>
          )}

          <p className="text-xs text-gray-400 mb-5">{raffle.name}</p>
          <Button variant="primary" fullWidth onClick={onClose}>Cerrar</Button>
        </div>
      </Modal>
    </>
  );
}
