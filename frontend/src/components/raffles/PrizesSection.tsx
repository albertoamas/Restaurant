import type { RafflePrizeDto, RaffleWinnerDto } from '@pos/shared';
import { Icon } from '../ui/Icon';
import type { BusyState } from '../../hooks/useRaffleDetail';
import type { BusinessInfo } from '../../utils/raffle-certificate';
import { IconGift, IconAward } from './RaffleIcons';
import { positionLabel } from '../../utils/raffle-utils';
import { printWinnerCertificate } from '../../utils/raffle-certificate';

const MEDAL: Record<number, string> = {
  1: 'bg-amber-100 text-amber-700 border-amber-300 ring-amber-100',
  2: 'bg-gray-100 text-gray-500 border-gray-300 ring-gray-100',
  3: 'bg-orange-50 text-orange-500 border-orange-200 ring-orange-50',
};

function PositionMedal({ position }: { position: number }) {
  const cls = MEDAL[position] ?? 'bg-gray-100 text-gray-500 border-gray-200 ring-gray-100';
  return (
    <span className={`w-8 h-8 rounded-full border flex items-center justify-center text-[11px] font-black shrink-0 ring-2 ${cls}`}>
      {position}°
    </span>
  );
}

interface Props {
  prizes:        RafflePrizeDto[];
  winners:       RaffleWinnerDto[];
  raffleName:    string;
  canVoid:       boolean;
  busy:          BusyState;
  voidConfirmId: string | null;
  onVoidRequest: (id: string) => void;
  onVoidConfirm: (id: string) => void;
  onVoidCancel:  () => void;
  business:      BusinessInfo;
}

export function PrizesSection({
  prizes, winners, raffleName, canVoid, busy,
  voidConfirmId, onVoidRequest, onVoidConfirm, onVoidCancel, business,
}: Props) {
  if (prizes.length === 0) return null;

  return (
    <section className="rounded-2xl border border-white/8 shadow-[0_10px_30px_oklch(0.06_0.010_38/0.6)] p-5" style={{ background: 'var(--color-surface-card)' }}>
      <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3">Premios</p>
      <div className="space-y-2">
        {prizes.map((p) => {
          const activeWinner  = winners.find((w) => w.position === p.position && !w.voided);
          const voidedWinner  = winners.find((w) => w.position === p.position &&  w.voided);
          const isConfirming  = voidConfirmId === activeWinner?.id;

          return (
            <div key={p.position} className={`rounded-xl border px-3.5 py-3 transition-colors ${
              activeWinner ? 'bg-amber-50 border-amber-200' : 'bg-gray-50 border-transparent'
            }`}>
              <div className="flex items-center gap-3">
                <PositionMedal position={p.position} />

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <IconGift className="w-3 h-3 text-gray-400 shrink-0" />
                    <p className="text-sm font-semibold text-gray-700 truncate">{p.prizeDescription}</p>
                  </div>

                  {activeWinner && !isConfirming && (
                    <div className="flex items-center gap-1.5">
                      <IconAward className="w-3 h-3 text-amber-500 shrink-0" />
                      <span className="text-xs font-semibold text-amber-800 truncate">{activeWinner.customer.name}</span>
                      <div className="ml-auto flex items-center gap-0.5">
                        <button
                          onClick={() => printWinnerCertificate(activeWinner, raffleName, business)}
                          title="Imprimir certificado"
                          className="text-gray-300 hover:text-primary-500 p-1 rounded-lg transition-colors"
                        >
                          <Icon name="print" size={14} strokeWidth={1.8} />
                        </button>
                        {canVoid && (
                          <button
                            onClick={() => onVoidRequest(activeWinner.id)}
                            disabled={!!busy}
                            className="text-[10px] text-gray-400 hover:text-red-500 hover:bg-red-50 px-2 py-0.5 rounded-lg transition-colors disabled:opacity-40"
                          >
                            Anular
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  {voidedWinner && !activeWinner && (
                    <p className="text-[10px] text-red-400 mt-0.5">
                      <span className="line-through">{voidedWinner.customer.name}</span>
                      {' '}· anulado
                    </p>
                  )}

                  {!activeWinner && !voidedWinner && (
                    <p className="text-[10px] text-gray-400 mt-0.5">
                      {positionLabel(p.position)} · Pendiente
                    </p>
                  )}
                </div>
              </div>

              {isConfirming && (
                <div className="flex items-center gap-2 mt-2.5 pt-2.5 border-t border-amber-200">
                  <p className="text-xs text-red-600 font-semibold flex-1">
                    ¿Anular a <strong>{activeWinner!.customer.name}</strong>?
                  </p>
                  <button
                    onClick={() => onVoidConfirm(activeWinner!.id)}
                    disabled={!!busy}
                    className="text-[11px] font-bold text-white bg-red-500 hover:bg-red-600 px-3 py-1 rounded-lg transition-colors disabled:opacity-50"
                  >
                    Sí, anular
                  </button>
                  <button
                    onClick={onVoidCancel}
                    className="text-[11px] text-gray-500 hover:text-gray-700 px-2 py-1 rounded-lg transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
