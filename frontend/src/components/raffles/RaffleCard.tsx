import type { RaffleDto, RaffleStatus } from '@pos/shared';
import { STATUS_CONFIG, StatusBadge } from './StatusBadge';
import { IconTicket, IconPackage, IconAward, IconGift } from './RaffleIcons';

export function RaffleCard({ raffle, onClick }: { raffle: RaffleDto; onClick: () => void }) {
  const cfg = STATUS_CONFIG[raffle.status as RaffleStatus] ?? STATUS_CONFIG['CLOSED'];
  const firstPrize = raffle.prizes.find((p) => p.position === 1);
  const activeWinners = raffle.winners.filter((w) => !w.voided);
  const isDone = raffle.status === 'DRAWN';
  const isDrawing = raffle.status === 'DRAWING';

  return (
    <button
      onClick={onClick}
      className="w-full text-left rounded-2xl overflow-hidden bg-white/90 backdrop-blur border border-white/60
        shadow-[0_4px_20px_oklch(0.13_0.012_260/0.07)] hover:shadow-[0_8px_28px_oklch(0.13_0.012_260/0.13)]
        hover:-translate-y-0.5 transition-all duration-200 flex flex-col"
    >
      <div className="flex flex-1">
        <div className={`w-1 flex-shrink-0 ${cfg.strip}`} />
        <div className="flex-1 px-4 pt-4 pb-3 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-2">
            <h3 className="font-heading font-bold text-gray-900 text-sm leading-snug line-clamp-2 flex-1">
              {raffle.name}
            </h3>
            <StatusBadge status={raffle.status as RaffleStatus} />
          </div>

          {raffle.productName && (
            <div className="flex items-center gap-1.5 mb-1.5">
              <IconPackage className="w-3 h-3 text-gray-400 shrink-0" />
              <span className="text-xs text-gray-500 truncate">{raffle.productName}</span>
            </div>
          )}

          {firstPrize && (
            <div className="flex items-center gap-1.5 mb-1.5">
              <IconGift className="w-3 h-3 text-gray-400 shrink-0" />
              <span className="text-xs text-gray-500 truncate">1er premio: {firstPrize.prizeDescription}</span>
            </div>
          )}

          {(isDrawing || isDone) && activeWinners.length > 0 && (
            <div className="mt-2 space-y-1">
              {activeWinners.map((w) => (
                  <div key={w.id} className="flex items-center gap-1.5 bg-amber-50 border border-amber-100 rounded-lg px-2.5 py-1.5">
                    <IconAward className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <span className="text-[11px] font-bold text-amber-500 shrink-0">{w.position}°</span>
                    <span className="text-xs font-semibold text-amber-800 truncate">{w.customer.name}</span>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>

      <div className="mx-4 border-t border-gray-100" />

      <div className="px-4 py-2.5 flex items-center justify-between text-xs text-gray-400">
        <span className="flex items-center gap-1.5">
          <IconTicket className="w-3.5 h-3.5" />
          <span>
            <strong className="text-gray-700 font-semibold">{raffle.ticketCount}</strong>
            {' '}ticket{raffle.ticketCount !== 1 ? 's' : ''}
          </span>
        </span>
        {(isDrawing || isDone) && (
          <span className="font-medium text-gray-400">
            {activeWinners.length}/{raffle.numberOfWinners} sorteado{activeWinners.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>
    </button>
  );
}
