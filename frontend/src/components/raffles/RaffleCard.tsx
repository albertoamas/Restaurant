import type { RaffleDto, RaffleStatus } from '@pos/shared';
import { Icon } from '../ui/Icon';
import { STATUS_CONFIG, StatusBadge } from './StatusBadge';
import { positionLabel } from '../../utils/raffle-utils';

/** Cómo se gana un ticket, en una frase. */
export function ticketRule(raffle: Pick<RaffleDto, 'ticketMode' | 'spendingThreshold' | 'productName'>): string {
  return raffle.ticketMode === 'SPENDING_THRESHOLD'
    ? `Un ticket cada Bs ${raffle.spendingThreshold} de consumo`
    : `Un ticket por cada ${raffle.productName ?? 'producto del sorteo'}`;
}

export function RaffleCard({ raffle, onClick }: { raffle: RaffleDto; onClick: () => void }) {
  const cfg = STATUS_CONFIG[raffle.status as RaffleStatus] ?? STATUS_CONFIG.CLOSED;
  const firstPrize = raffle.prizes.find((p) => p.position === 1);
  const winners = raffle.winners.filter((w) => !w.voided).sort((a, b) => a.position - b.position);

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`Ver sorteo ${raffle.name}`}
      className={`flex h-full w-full flex-col rounded-card border border-line border-l-4 ${cfg.strip} bg-surface-card p-4 text-left shadow-raised transition-[border-color,box-shadow] hover:shadow-floating focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/60`}
    >
      <div className="flex items-start justify-between gap-3">
        <h2 className="min-w-0 text-heading font-semibold text-main leading-snug line-clamp-2">{raffle.name}</h2>
        <StatusBadge status={raffle.status as RaffleStatus} />
      </div>
      <p className="mt-1 text-label text-soft">{ticketRule(raffle)}</p>

      {firstPrize && (
        <p className="mt-3 flex items-center gap-2 text-body text-main">
          <Icon name="gift" size={16} className="shrink-0 text-primary-600 dark:text-primary-400" />
          <span className="min-w-0 truncate">{firstPrize.prizeDescription}</span>
        </p>
      )}

      {winners.length > 0 && (
        <ul className="mt-3 space-y-1">
          {winners.map((w) => (
            <li key={w.id} className="flex items-baseline gap-2 text-label">
              <span className="w-16 shrink-0 text-muted">{positionLabel(w.position)}</span>
              <span className="min-w-0 truncate font-semibold text-main">{w.customer.name}</span>
            </li>
          ))}
        </ul>
      )}

      {/* Empuja el pie al fondo: las tarjetas de una fila quedan parejas. */}
      <div className="min-h-3 flex-1" />
      <div className="flex items-center justify-between gap-3 border-t border-line pt-3 text-label text-soft">
        <span className="inline-flex items-center gap-1.5">
          <Icon name="ticket" size={16} />
          {raffle.ticketCount === 1 ? '1 ticket' : `${raffle.ticketCount} tickets`}
        </span>
        <span>{winners.length} de {raffle.numberOfWinners} sorteados</span>
      </div>
    </button>
  );
}
