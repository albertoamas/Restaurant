import { useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Confetti } from '../ui/Confetti';
import type { RaffleWinnerDto } from '@pos/shared';
import { IconAward, IconTicket, IconGift } from './RaffleIcons';
import { playWinnerFanfare } from '../../utils/raffle-sounds';

function positionLabel(position: number): string {
  if (position === 1) return '1er Lugar';
  if (position === 2) return '2do Lugar';
  if (position === 3) return '3er Lugar';
  return `${position}° Lugar`;
}

export function WinnerModal({
  raffleName,
  winner,
  onClose,
}: {
  raffleName: string;
  winner: RaffleWinnerDto;
  onClose: () => void;
}) {
  useEffect(() => {
    playWinnerFanfare();
  }, []);

  return (
    <>
      <Confetti active />
      <Modal isOpen onClose={onClose} title="" size="sm">
        <div className="text-center px-2 pb-2">
          <div className="flex items-center justify-center mx-auto mb-3">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-amber-100 to-amber-200 border-4 border-amber-300/60 flex items-center justify-center shadow-[0_0_0_8px_oklch(0.92_0.10_80/0.20)]">
              <IconAward className="w-9 h-9 text-amber-600" />
            </div>
          </div>

          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-amber-600 mb-1">
            {positionLabel(winner.position)}
          </p>

          <p className="text-3xl font-heading font-black text-gray-900 leading-tight mb-1">
            {winner.customer.name}
          </p>

          {winner.customer.phone && (
            <p className="text-sm text-gray-400 mb-3">{winner.customer.phone}</p>
          )}

          <div className="inline-flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 mb-3">
            <IconTicket className="w-4 h-4 text-gray-400" />
            <span className="text-sm font-mono font-bold text-gray-700">
              Ticket #{winner.ticketNumber}
            </span>
          </div>

          {winner.prizeDescription && (
            <div className="flex items-center justify-center gap-2 mb-3">
              <IconGift className="w-4 h-4 text-indigo-400 shrink-0" />
              <span className="text-sm font-semibold text-indigo-700">{winner.prizeDescription}</span>
            </div>
          )}

          <p className="text-xs text-gray-400 mb-5">{raffleName}</p>
          <Button variant="primary" fullWidth onClick={onClose}>Cerrar</Button>
        </div>
      </Modal>
    </>
  );
}
