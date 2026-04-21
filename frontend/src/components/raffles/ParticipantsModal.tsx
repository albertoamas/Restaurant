import { useState } from 'react';
import { Modal } from '../ui/Modal';
import { IconStar } from './RaffleIcons';
import type { DetailRaffle } from './types';

function positionLabel(position: number): string {
  if (position === 1) return '1er lugar';
  if (position === 2) return '2do lugar';
  if (position === 3) return '3er lugar';
  return `${position}° lugar`;
}

export function ParticipantsModal({
  raffle,
  onClose,
}: {
  raffle: DetailRaffle;
  onClose: () => void;
}) {
  const [search, setSearch] = useState('');

  const q = search.toLowerCase().trim();
  const filtered = q
    ? raffle.tickets.filter(
        (t) =>
          t.customer.name.toLowerCase().includes(q) ||
          (t.customer.phone ?? '').toLowerCase().includes(q)
      )
    : raffle.tickets;

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={`Participantes — ${raffle.name}`}
      size="full"
    >
      <div className="space-y-3">
        {/* Buscador */}
        <div className="relative">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none"
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
          </svg>
          <input
            type="text"
            autoFocus
            placeholder="Buscar por nombre o teléfono…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-3 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-300 focus:border-violet-400 placeholder:text-gray-400"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Contador */}
        <p className="text-xs text-gray-400">
          {filtered.length === raffle.tickets.length
            ? `${raffle.tickets.length} participante${raffle.tickets.length !== 1 ? 's' : ''}`
            : `${filtered.length} de ${raffle.tickets.length} participantes`}
        </p>

        {/* Lista */}
        {raffle.tickets.length === 0 ? (
          <div className="text-center py-16 text-gray-400 text-sm border border-dashed border-gray-200 rounded-xl">
            Sin tickets aún
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-400 text-sm">
            Sin resultados para "{search}"
          </div>
        ) : (
          <div className="space-y-1.5 max-h-[420px] overflow-y-auto pr-0.5">
            {filtered.map((t) => {
              const win = raffle.winners.find((w) => w.ticketId === t.id && !w.voided);
              return (
                <div
                  key={t.id}
                  className={`flex items-center gap-3 rounded-xl px-4 py-3 transition-colors ${
                    win ? 'bg-amber-50 border border-amber-100' : 'bg-gray-50'
                  }`}
                >
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
    </Modal>
  );
}
