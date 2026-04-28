import { useEffect } from 'react';
import { Button } from '../ui/Button';
import { Confetti } from '../ui/Confetti';
import type { RaffleWinnerDto } from '@pos/shared';
import { IconTicket, IconGift } from './RaffleIcons';
import { playWinnerFanfare } from '../../utils/raffle-sounds';
import { positionLabel } from '../../utils/raffle-utils';
import { printWinnerCertificate } from '../../utils/raffle-certificate';
import { useAuth } from '../../context/auth.context';
import { useSettingsStore } from '../../store/settings.store';

// ─── Position medal config ────────────────────────────────────────────────────

const MEDAL: Record<number, { badge: string; glow: string; text: string }> = {
  1: { badge: 'from-amber-400 to-amber-500',  glow: 'oklch(0.73 0.16 85 / 0.50)',  text: 'oklch(0.73 0.16 85)'  },
  2: { badge: 'from-gray-300 to-gray-400',     glow: 'oklch(0.70 0.01 260 / 0.40)', text: 'oklch(0.70 0.01 260)' },
  3: { badge: 'from-orange-400 to-orange-500', glow: 'oklch(0.68 0.18 45 / 0.45)',  text: 'oklch(0.68 0.18 45)'  },
};
const DEFAULT_MEDAL = {
  badge: 'from-primary-500 to-primary-600',
  glow:  'oklch(0.55 0.16 232 / 0.40)',
  text:  'oklch(0.55 0.16 232)',
};

// ─── WinnerModal ──────────────────────────────────────────────────────────────

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

  const { user } = useAuth();
  const { businessAddress, businessPhone } = useSettingsStore();
  const business = {
    name:    user?.tenantName ?? '',
    address: businessAddress || undefined,
    phone:   businessPhone   || undefined,
  };

  const medal = MEDAL[winner.position] ?? DEFAULT_MEDAL;
  const hasPhone = Boolean(winner.customer.phone);

  return (
    <>
      <Confetti active />

      <div
        className="fixed inset-0 z-[80] flex items-center justify-center p-4"
        style={{ background: 'oklch(0.10 0.015 255 / 0.96)', backdropFilter: 'blur(4px)' }}
      >
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: `radial-gradient(ellipse 60% 40% at 50% 50%, ${medal.glow} 0%, transparent 100%)` }}
        />

        <div
          className="relative z-10 w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden"
          style={{ animation: 'winner-pop 0.45s cubic-bezier(0.34, 1.56, 0.64, 1) both' }}
        >
          <div className={`h-1 w-full bg-gradient-to-r ${medal.badge}`} />

          <div className="px-7 py-7 text-center">

            {/* Position medal */}
            <div className="relative inline-flex mb-5">
              <div
                className={`w-20 h-20 rounded-full bg-gradient-to-br ${medal.badge} flex items-center justify-center shadow-xl`}
                style={{ boxShadow: `0 0 30px ${medal.glow}, 0 4px 16px rgba(0,0,0,0.15)` }}
              >
                <span className="text-2xl font-black text-white">{winner.position}°</span>
              </div>
            </div>

            <p className="text-[10px] font-black uppercase tracking-[0.35em] mb-2" style={{ color: medal.text }}>
              {positionLabel(winner.position)}
            </p>

            {/* Winner name — mb-4 always so ticket badge has consistent top spacing
                whether or not a phone is present */}
            <p className={`text-3xl font-heading font-black text-gray-900 leading-tight ${hasPhone ? 'mb-0.5' : 'mb-4'}`}>
              {winner.customer.name}
            </p>

            {hasPhone && (
              <p className="text-sm text-gray-400 mb-4">{winner.customer.phone}</p>
            )}

            {/* Ticket */}
            <div className="inline-flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-xl px-3 py-1.5 mb-4">
              <IconTicket className="w-3.5 h-3.5 text-gray-400" />
              <span className="text-sm font-mono font-bold text-gray-600">
                Ticket #{winner.ticketNumber}
              </span>
            </div>

            {/* Prize */}
            {winner.prizeDescription && (
              <div className="flex items-center justify-center gap-2 mb-4 px-4 py-2.5 bg-primary-50 border border-primary-100 rounded-xl">
                <IconGift className="w-4 h-4 text-primary-500 shrink-0" />
                <span className="text-sm font-semibold text-primary-700">{winner.prizeDescription}</span>
              </div>
            )}

            <p className="text-xs text-gray-400 mb-5">{raffleName}</p>

            <Button variant="primary" fullWidth onClick={onClose}>
              Continuar
            </Button>

            <button
              onClick={() => printWinnerCertificate(winner, raffleName, business)}
              className="mt-2.5 w-full flex items-center justify-center gap-1.5 text-[11px] text-gray-400 hover:text-gray-600 py-1.5 transition-colors"
            >
              <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M6 9V3h12v6M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2M9 21h6v-6H9v6z" />
              </svg>
              Imprimir certificado
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes winner-pop {
          from { opacity: 0; transform: scale(0.75) translateY(20px); }
          to   { opacity: 1; transform: scale(1)    translateY(0);    }
        }
      `}</style>
    </>
  );
}
