import type { RaffleDto, RaffleStatus } from '@pos/shared';
import { STATUS_CONFIG, StatusBadge } from './StatusBadge';
import { IconTicket, IconPackage, IconAward, IconGift, IconCoins } from './RaffleIcons';

export function RaffleCard({ raffle, onClick }: { raffle: RaffleDto; onClick: () => void }) {
  const cfg = STATUS_CONFIG[raffle.status as RaffleStatus] ?? STATUS_CONFIG['CLOSED'];
  const firstPrize = raffle.prizes.find((p) => p.position === 1);
  const activeWinners = raffle.winners.filter((w) => !w.voided);
  const isDone = raffle.status === 'DRAWN';
  const isDrawing = raffle.status === 'DRAWING';

  return (
    <button
      onClick={onClick}
      className="w-full text-left rounded-2xl overflow-hidden border border-[var(--border-subtle)]
        shadow-card-md
        hover:shadow-card-xl
        hover:-translate-y-0.5 transition-all duration-200 flex flex-col"
      style={{ background: 'var(--color-surface-card)' }}
    >
      <div className="flex flex-1 min-w-0">
        {/* Status strip */}
        <div className={`w-1.5 shrink-0 ${cfg.strip}`} />

        <div className="flex-1 px-4 pt-4 pb-3 min-w-0">
          {/* Name + badge */}
          <div className="flex items-start justify-between gap-2 mb-3">
            <h3 className="font-heading font-bold text-gray-800 text-sm leading-snug line-clamp-2 flex-1">
              {raffle.name}
            </h3>
            <StatusBadge status={raffle.status as RaffleStatus} />
          </div>

          {/* Meta */}
          <div className="space-y-1.5">
            {raffle.ticketMode === 'SPENDING_THRESHOLD' ? (
              <div className="flex items-center gap-2">
                <IconCoins className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span className="text-xs text-gray-500 truncate">
                  Cada{' '}
                  <span className="text-gray-600 font-semibold">{raffle.spendingThreshold} Bs</span>
                  {' '}= 1 ticket
                </span>
              </div>
            ) : raffle.productName ? (
              <div className="flex items-center gap-2">
                <IconPackage className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                <span className="text-xs text-gray-500 truncate">{raffle.productName}</span>
              </div>
            ) : null}

            {firstPrize && (
              <div className="flex items-center gap-2">
                <IconGift className="w-3.5 h-3.5 text-primary-400 shrink-0" />
                <span className="text-xs text-gray-500 truncate">
                  1er premio:{' '}
                  <span className="text-gray-600">{firstPrize.prizeDescription}</span>
                </span>
              </div>
            )}
          </div>

          {/* Winners */}
          {(isDrawing || isDone) && activeWinners.length > 0 && (
            <div className="mt-3 space-y-1">
              {activeWinners.map((w) => (
                <div
                  key={w.id}
                  className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 bg-amber-500/10 border border-amber-500/20"
                >
                  <IconAward className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span className="text-[11px] font-black text-amber-400 shrink-0">{w.position}°</span>
                  <span className="text-xs font-semibold text-amber-300 truncate">{w.customer.name}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-[var(--border-subtle)] mx-4" />
      <div className="px-4 py-2.5 flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-xs text-gray-500">
          <IconTicket className="w-3.5 h-3.5" />
          <span>
            <strong className="text-gray-600 font-semibold">{raffle.ticketCount}</strong>
            {' '}ticket{raffle.ticketCount !== 1 ? 's' : ''}
          </span>
        </span>
        {(isDrawing || isDone) && (
          <span className="text-xs font-medium text-gray-500">
            {activeWinners.length}/{raffle.numberOfWinners} sorteado{activeWinners.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>
    </button>
  );
}
