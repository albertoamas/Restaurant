import type { RafflePrizeDto, RaffleWinnerDto } from '@pos/shared';
import { ActionMenu } from '../ui/ActionMenu';
import type { BusinessInfo } from '../../utils/raffle-certificate';
import { positionLabel } from '../../utils/raffle-utils';
import { printWinnerCertificate } from '../../utils/raffle-certificate';

/** Primer lugar en oro de la marca; los demás neutros. */
function Place({ position }: { position: number }) {
  const first = position === 1;
  return (
    <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border text-label font-bold tabular-nums ${
      first ? 'border-amber-500/40 bg-amber-500/15 text-amber-800 dark:text-amber-300' : 'border-line bg-surface-2 text-soft'
    }`}>
      {position}°
    </span>
  );
}

interface Props {
  prizes:     RafflePrizeDto[];
  winners:    RaffleWinnerDto[];
  raffleName: string;
  canVoid:    boolean;
  /** Pide confirmación para anular un ganador (la ventana vive en la página). */
  onVoid:     (winner: RaffleWinnerDto) => void;
  business:   BusinessInfo;
}

/** Cada lugar con su premio y, si ya salió, su ganador; certificado y anular en el menú del lugar. */
export function PrizesSection({ prizes, winners, raffleName, canVoid, onVoid, business }: Props) {
  if (prizes.length === 0) return null;

  return (
    <ul className="divide-y divide-line">
      {[...prizes].sort((a, b) => a.position - b.position).map((p) => {
        const winner = winners.find((w) => w.position === p.position && !w.voided);
        const voided = winners.filter((w) => w.position === p.position && w.voided);
        return (
          <li key={p.position} className="flex items-center gap-3 px-4 py-3 sm:px-5">
            <Place position={p.position} />
            <div className="min-w-0 flex-1">
              <p className="text-body font-semibold text-main">{p.prizeDescription}</p>
              {winner ? (
                <p className="text-label text-main">
                  Ganó <span className="font-semibold">{winner.customer.name}</span>
                  <span className="text-muted"> con el ticket #{winner.ticketNumber}</span>
                </p>
              ) : (
                <p className="text-label text-muted">{positionLabel(p.position)}: sin sortear</p>
              )}
              {voided.length > 0 && (
                <p className="text-caption text-muted">
                  Anulado: {voided.map((v) => v.customer.name).join(', ')}
                </p>
              )}
            </div>
            {winner && (
              <ActionMenu
                label={`Más acciones del ${positionLabel(p.position)}`}
                items={[
                  { label: 'Imprimir certificado', icon: 'print', onSelect: () => printWinnerCertificate(winner, raffleName, business) },
                  ...(canVoid ? [{ label: 'Anular ganador', icon: 'ban' as const, danger: true, onSelect: () => onVoid(winner) }] : []),
                ]}
              />
            )}
          </li>
        );
      })}
    </ul>
  );
}
