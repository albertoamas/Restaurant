import { createPortal } from 'react-dom';
import { useEffect } from 'react';
import { Button } from '../ui/Button';
import { Confetti } from '../ui/Confetti';
import { Icon } from '../ui/Icon';
import type { RaffleWinnerDto } from '@pos/shared';
import { playWinnerFanfare } from '../../utils/raffle-sounds';
import { positionLabel } from '../../utils/raffle-utils';
import { printWinnerCertificate } from '../../utils/raffle-certificate';
import { useAuth } from '../../context/auth.context';
import { useSettingsStore } from '../../store/settings.store';

// Mismo escenario oscuro que la pantalla del sorteo: es la continuación del show.
const STAGE_BG = 'oklch(0.17 0.012 45 / 0.97)';
const CARD_BG  = 'oklch(0.23 0.012 45)';
const EDGE     = 'oklch(0.32 0.014 45)';
const TEXT     = 'oklch(0.96 0.008 60)';
const SOFT     = 'oklch(0.78 0.012 60)';
const BRAND    = 'oklch(0.72 0.19 45)';
const BRAND_A  = 'oklch(0.72 0.19 45 /';

/** Anuncio del ganador recién sorteado, con confeti y fanfarria. */
export function WinnerModal({
  raffleName,
  winner,
  onClose,
}: {
  raffleName: string;
  winner: RaffleWinnerDto;
  onClose: () => void;
}) {
  useEffect(() => { playWinnerFanfare(); }, []);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const { user } = useAuth();
  const { businessAddress, businessPhone } = useSettingsStore();
  const business = { name: user?.tenantName ?? '', address: businessAddress || undefined, phone: businessPhone || undefined };

  // En el body, por la misma razón que la pantalla del sorteo: cubrir la pantalla completa.
  return createPortal(
    <>
      <Confetti active />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="winner-name"
        className="fixed inset-0 z-[80] flex items-center justify-center p-4"
        style={{ background: STAGE_BG }}
      >
        <div
          className="pointer-events-none absolute inset-0"
          style={{ background: `radial-gradient(ellipse 60% 45% at 50% 50%, ${BRAND_A} 0.30) 0%, transparent 100%)` }}
        />

        <div
          className="relative z-10 w-full max-w-sm overflow-hidden rounded-dialog text-center"
          style={{ background: CARD_BG, border: `1px solid ${EDGE}`, boxShadow: `0 24px 70px ${BRAND_A} 0.25)`, animation: 'winner-pop 0.45s cubic-bezier(0.34, 1.56, 0.64, 1) both' }}
        >
          <div className="h-1.5 w-full" style={{ background: BRAND }} />
          <div className="px-6 py-7">
            <div
              className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full font-heading text-title font-bold tabular-nums"
              style={{ background: `${BRAND_A} 0.18)`, border: `2px solid ${BRAND}`, color: BRAND }}
            >
              {winner.position}°
            </div>

            <p className="text-label font-semibold" style={{ color: BRAND }}>Ganador del {positionLabel(winner.position)}</p>
            <p id="winner-name" className="mt-1 font-heading text-display font-bold leading-tight" style={{ color: TEXT }}>
              {winner.customer.name}
            </p>
            <p className="mt-1 text-body tabular-nums" style={{ color: SOFT }}>
              {[winner.customer.phone, `Ticket #${winner.ticketNumber}`].filter(Boolean).join('. ')}
            </p>

            {winner.prizeDescription && (
              <p
                className="mt-5 flex items-center justify-center gap-2 rounded-control px-4 py-3 text-body font-semibold"
                style={{ background: `${BRAND_A} 0.14)`, border: `1px solid ${BRAND_A} 0.4)`, color: TEXT }}
              >
                <span className="shrink-0" style={{ color: BRAND }}><Icon name="gift" size={18} /></span>
                {winner.prizeDescription}
              </p>
            )}

            <p className="mt-4 text-label" style={{ color: SOFT }}>{raffleName}</p>

            <div className="mt-5 grid gap-2">
              <Button size="lg" fullWidth onClick={onClose} autoFocus>Continuar</Button>
              <Button
                variant="ghost"
                fullWidth
                onClick={() => printWinnerCertificate(winner, raffleName, business)}
                style={{ color: SOFT }}
              >
                <Icon name="print" size={18} />
                Imprimir certificado
              </Button>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes winner-pop {
          from { opacity: 0; transform: scale(0.8) translateY(20px); }
          to   { opacity: 1; transform: scale(1)   translateY(0);    }
        }
        @media (prefers-reduced-motion: reduce) {
          @keyframes winner-pop { from { opacity: 0; } to { opacity: 1; } }
        }
      `}</style>
    </>,
    document.body,
  );
}
