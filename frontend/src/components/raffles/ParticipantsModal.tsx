import { useState } from 'react';
import { IconStar, IconCoins, IconTicket } from './RaffleIcons';
import type { RaffleSpendingDto } from '@pos/shared';
import type { DetailRaffle } from './types';
import { positionLabel } from '../../utils/raffle-utils';

interface SpendingTicket {
  id: string;
  ticketNumber: number;
  winnerPosition?: number;
}

function SearchBox({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="relative">
      <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none"
        fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
      </svg>
      <input
        type="text"
        placeholder="Buscar por nombre o teléfono…"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full pl-10 pr-3 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-300 focus:border-violet-400 placeholder:text-gray-400"
      />
      {value && (
        <button onClick={() => onChange('')}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
}

function SpendingRow({
  spending,
  threshold,
  isWinner,
  winnerPosition,
  customerTickets = [],
}: {
  spending: RaffleSpendingDto;
  threshold: number;
  isWinner: boolean;
  winnerPosition?: number;
  customerTickets?: SpendingTicket[];
}) {
  const progressInBracket = spending.totalSpent % threshold;
  const pct = Math.round((progressInBracket / threshold) * 100);

  return (
    <div className={`rounded-xl px-4 py-3 ${isWinner ? 'bg-amber-50 border border-amber-100' : 'bg-gray-50'}`}>
      <div className="flex items-center gap-3 mb-2">
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-semibold truncate ${isWinner ? 'text-amber-900' : 'text-gray-800'}`}>
            {spending.customer.name}
          </p>
          {spending.customer.phone && (
            <p className="text-xs text-gray-400 mt-0.5">{spending.customer.phone}</p>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="inline-flex items-center gap-1 text-xs font-bold text-violet-700 bg-violet-50 border border-violet-100 px-2 py-0.5 rounded-full">
            <IconTicket className="w-3 h-3" />
            {spending.ticketsEarned}
          </span>
          {isWinner && winnerPosition !== undefined && (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-100 px-2.5 py-1 rounded-full uppercase tracking-wide">
              <IconStar className="w-2.5 h-2.5" />
              {positionLabel(winnerPosition)}
            </span>
          )}
        </div>
      </div>

      {customerTickets.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {customerTickets.map((t) => (
            <span
              key={t.id}
              title={t.winnerPosition !== undefined ? positionLabel(t.winnerPosition) : undefined}
              className={`inline-flex items-center gap-0.5 text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-md ${
                t.winnerPosition !== undefined
                  ? 'bg-amber-200 text-amber-800'
                  : 'bg-gray-200 text-gray-500'
              }`}
            >
              #{t.ticketNumber}
              {t.winnerPosition !== undefined && <IconStar className="w-2 h-2" />}
            </span>
          ))}
        </div>
      )}

      <div className="mt-1.5">
        <div className="flex items-center gap-2 mb-1">
          <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
            <div className="h-full bg-amber-400 rounded-full transition-all duration-300"
              style={{ width: `${pct}%` }} />
          </div>
          <span className="text-[10px] font-medium text-gray-400 tabular-nums shrink-0">{progressInBracket}/{threshold} Bs</span>
        </div>
      </div>
    </div>
  );
}

// ─── Lista embebible (sin modal wrapper) ──────────────────────────────────────

export function ParticipantsList({ raffle }: { raffle: DetailRaffle }) {
  const [search, setSearch] = useState('');
  const q = search.toLowerCase().trim();
  const isSpending = raffle.ticketMode === 'SPENDING_THRESHOLD';

  if (isSpending) {
    const filtered = q
      ? raffle.spendings.filter(
          (s) =>
            s.customer.name.toLowerCase().includes(q) ||
            (s.customer.phone ?? '').toLowerCase().includes(q),
        )
      : raffle.spendings;

    const threshold = raffle.spendingThreshold ?? 1;
    const activeWinners = raffle.winners.filter((w) => !w.voided);
    const winnerByCustomer = new Map(activeWinners.map((w) => [w.customerId, w.position]));
    const winnerByTicket = new Map(activeWinners.map((w) => [w.ticketId, w.position]));

    return (
      <div className="space-y-3">
        <SearchBox value={search} onChange={setSearch} />

        <div className="flex items-center justify-between">
          <p className="text-xs text-gray-400">
            {filtered.length === raffle.spendings.length
              ? `${raffle.spendings.length} cliente${raffle.spendings.length !== 1 ? 's' : ''}`
              : `${filtered.length} de ${raffle.spendings.length} clientes`}
          </p>
          <span className="inline-flex items-center gap-1 text-[10px] text-amber-700 bg-amber-50 border border-amber-100 px-2 py-0.5 rounded-full">
            <IconCoins className="w-3 h-3" />
            Cada {threshold} Bs = 1 ticket
          </span>
        </div>

        {raffle.spendings.length === 0 ? (
          <div className="text-center py-10 text-gray-400 text-sm border border-dashed border-gray-200 rounded-xl">
            Sin acumulados aún
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-10 text-gray-400 text-sm">
            Sin resultados para "{search}"
          </div>
        ) : (
          <div className="space-y-1.5">
            {filtered.map((s) => {
              const customerTickets: SpendingTicket[] = (raffle.tickets ?? [])
                .filter((t) => t.customerId === s.customerId)
                .map((t) => ({ id: t.id, ticketNumber: t.ticketNumber, winnerPosition: winnerByTicket.get(t.id) }));
              return (
                <SpendingRow
                  key={s.customerId}
                  spending={s}
                  threshold={threshold}
                  isWinner={winnerByCustomer.has(s.customerId)}
                  winnerPosition={winnerByCustomer.get(s.customerId)}
                  customerTickets={customerTickets}
                />
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // ── Vista por producto (PRODUCT_MATCH) ───────────────────────────────────────

  const filtered = q
    ? raffle.tickets.filter(
        (t) =>
          t.customer.name.toLowerCase().includes(q) ||
          (t.customer.phone ?? '').toLowerCase().includes(q),
      )
    : raffle.tickets;

  return (
    <div className="space-y-3">
      <SearchBox value={search} onChange={setSearch} />

      <p className="text-xs text-gray-400">
        {filtered.length === raffle.tickets.length
          ? `${raffle.tickets.length} participante${raffle.tickets.length !== 1 ? 's' : ''}`
          : `${filtered.length} de ${raffle.tickets.length} participantes`}
      </p>

      {raffle.tickets.length === 0 ? (
        <div className="text-center py-10 text-gray-400 text-sm border border-dashed border-gray-200 rounded-xl">
          Sin tickets aún
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-10 text-gray-400 text-sm">
          Sin resultados para "{search}"
        </div>
      ) : (
        <div className="space-y-1.5">
          {filtered.map((t) => {
            const win = raffle.winners.find((w) => w.ticketId === t.id && !w.voided);
            return (
              <div key={t.id} className={`flex items-center gap-3 rounded-xl px-4 py-3 transition-colors ${
                win ? 'bg-amber-50 border border-amber-100' : 'bg-gray-50'
              }`}>
                <span className={`text-xs font-mono font-bold shrink-0 w-9 text-center ${
                  win ? 'text-amber-700' : 'text-gray-400'
                }`}>
                  #{t.ticketNumber}
                </span>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-semibold truncate ${win ? 'text-amber-900' : 'text-gray-800'}`}>
                    {t.customer.name}
                  </p>
                  {t.customer.phone && (
                    <p className="text-xs text-gray-400 mt-0.5">{t.customer.phone}</p>
                  )}
                </div>
                {win && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-100 px-2.5 py-1 rounded-full shrink-0 uppercase tracking-wide">
                    <IconStar className="w-2.5 h-2.5" />
                    {positionLabel(win.position)}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

