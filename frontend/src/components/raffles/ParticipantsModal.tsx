import { useState } from 'react';
import toast from 'react-hot-toast';
import { Icon } from '../ui/Icon';
import { IconStar, IconCoins, IconTicket } from './RaffleIcons';
import type { RaffleSpendingDto } from '@pos/shared';
import type { DetailRaffle } from './types';
import { positionLabel } from '../../utils/raffle-utils';
import { rafflesApi } from '../../api/raffles.api';
import { handleApiError } from '../../utils/api-error';
import { Modal } from '../ui/Modal';
import { printRaffleTickets, type RaffleTicketPrintSettings } from '../../utils/print';

interface SpendingTicket {
  id: string;
  ticketNumber: number;
  delivered: boolean;
  winnerPosition?: number;
}

// ─── Modal de selección de tickets a imprimir ─────────────────────────────────

function PrintSelectModal({
  tickets,
  customerName,
  localDelivered,
  localUndelivered,
  raffleName,
  printSettings,
  onClose,
}: {
  tickets: SpendingTicket[];
  customerName: string;
  localDelivered: Set<string>;
  localUndelivered: Set<string>;
  raffleName: string;
  printSettings: RaffleTicketPrintSettings;
  onClose: () => void;
}) {
  const isDelivered = (t: SpendingTicket) =>
    (t.delivered || localDelivered.has(t.id)) && !localUndelivered.has(t.id);

  const handlePrint = (t: SpendingTicket) => {
    printRaffleTickets([{ ticketNumber: t.ticketNumber, customerName }], raffleName, printSettings);
    onClose();
  };

  return (
    <Modal isOpen onClose={onClose} title={`Imprimir ticket — ${customerName}`} size="sm">
      <div className="space-y-1.5">
        {tickets.map((t) => {
          const delivered = isDelivered(t);
          return (
            <button
              key={t.id}
              onClick={() => handlePrint(t)}
              className="w-full flex items-center gap-3 rounded-xl px-3 py-2.5 bg-gray-50 hover:bg-violet-50 hover:border-violet-200 border border-gray-100 transition-colors text-left"
            >
              <span className="font-mono font-bold text-sm text-gray-700 w-10 shrink-0">
                #{t.ticketNumber}
              </span>
              <span className={`text-[11px] font-medium ${
                t.winnerPosition !== undefined
                  ? 'text-amber-700'
                  : delivered
                  ? 'text-emerald-600'
                  : 'text-gray-400'
              }`}>
                {t.winnerPosition !== undefined
                  ? `★ ${positionLabel(t.winnerPosition)}`
                  : delivered
                  ? '✓ Entregado'
                  : 'Pendiente'}
              </span>
              <svg className="w-3.5 h-3.5 text-gray-300 ml-auto shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <polyline points="6 9 6 2 18 2 18 9" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                <rect x="6" y="14" width="12" height="8" />
              </svg>
            </button>
          );
        })}
      </div>
    </Modal>
  );
}

// ─── Componentes auxiliares ───────────────────────────────────────────────────

function PrintButton({ onClick, title }: { onClick: () => void; title: string }) {
  return (
    <button
      onClick={onClick}
      title={title}
      className="w-6 h-6 flex items-center justify-center rounded-md text-gray-400 hover:text-violet-400 hover:bg-violet-500/10 transition-colors shrink-0"
    >
      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <polyline points="6 9 6 2 18 2 18 9" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
        <rect x="6" y="14" width="12" height="8" />
      </svg>
    </button>
  );
}

function SearchBox({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="relative">
      <Icon name="search" size={16} strokeWidth={2} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
      <input
        type="text"
        placeholder="Buscar por nombre o teléfono…"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full pl-10 pr-3 py-2.5 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400 placeholder:text-gray-400"
      />
      {value && (
        <button onClick={() => onChange('')}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
          <Icon name="x" size={14} strokeWidth={2} />
        </button>
      )}
    </div>
  );
}

// ─── Fila de cliente colapsable (modo SPENDING_THRESHOLD) ────────────────────

function SpendingRow({
  spending,
  threshold,
  isWinner,
  winnerPosition,
  customerTickets = [],
  localDelivered,
  localUndelivered,
  onToggleDelivery,
  raffleName,
  printSettings,
}: {
  spending: RaffleSpendingDto;
  threshold: number;
  isWinner: boolean;
  winnerPosition?: number;
  customerTickets?: SpendingTicket[];
  localDelivered: Set<string>;
  localUndelivered: Set<string>;
  onToggleDelivery: (ticketId: string, deliver: boolean) => Promise<void>;
  raffleName: string;
  printSettings: RaffleTicketPrintSettings;
}) {
  const [collapsed, setCollapsed] = useState(true);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [printSelectOpen, setPrintSelectOpen] = useState(false);

  const progressInBracket = spending.totalSpent % threshold;
  const pct = Math.round((progressInBracket / threshold) * 100);

  const isEffectivelyDelivered = (t: SpendingTicket) =>
    (t.delivered || localDelivered.has(t.id)) && !localUndelivered.has(t.id);

  const deliveredCount = customerTickets.filter(isEffectivelyDelivered).length;
  const allDelivered   = customerTickets.length > 0 && deliveredCount === customerTickets.length;
  const hasTickets     = customerTickets.length > 0;

  const handleToggle = async (ticketId: string, deliver: boolean) => {
    setTogglingId(ticketId);
    try {
      await onToggleDelivery(ticketId, deliver);
    } finally {
      setTogglingId(null);
    }
  };

  return (
    <div className={`rounded-xl overflow-hidden ${isWinner ? 'bg-amber-50 border border-amber-200' : 'bg-gray-50 border border-gray-100'}`}>

      {/* ── Cabecera — clic para expandir/colapsar ── */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => hasTickets && setCollapsed((c) => !c)}
        onKeyDown={(e) => e.key === 'Enter' && hasTickets && setCollapsed((c) => !c)}
        className={`flex items-center gap-3 px-4 py-3 ${hasTickets ? 'cursor-pointer select-none' : 'cursor-default'}`}
      >
        {/* Nombre + teléfono */}
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-semibold truncate ${isWinner ? 'text-amber-900' : 'text-gray-800'}`}>
            {spending.customer.name}
          </p>
          {spending.customer.phone && (
            <p className="text-xs text-gray-400 mt-0.5">{spending.customer.phone}</p>
          )}
        </div>

        {/* Badges + acciones */}
        <div className="flex items-center gap-1.5 shrink-0">

          {/* Tickets ganados */}
          <span className="inline-flex items-center gap-1 text-xs font-bold text-violet-700 bg-violet-50 border border-violet-200 px-2 py-0.5 rounded-full">
            <IconTicket className="w-3 h-3" />
            {spending.ticketsEarned}
          </span>

          {/* Resumen de entrega */}
          {hasTickets && (
            allDelivered ? (
              <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full whitespace-nowrap">
                ✓ todos
              </span>
            ) : deliveredCount > 0 ? (
              <span className="text-[10px] font-semibold text-orange-600 bg-orange-50 border border-orange-100 px-2 py-0.5 rounded-full whitespace-nowrap">
                {deliveredCount}/{customerTickets.length}
              </span>
            ) : null
          )}

          {/* Ganador */}
          {isWinner && winnerPosition !== undefined && (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-100 px-2.5 py-1 rounded-full uppercase tracking-wide">
              <IconStar className="w-2.5 h-2.5" />
              {positionLabel(winnerPosition)}
            </span>
          )}

          {/* Imprimir — detiene propagación para no colapsar */}
          {hasTickets && (
            <div onClick={(e) => e.stopPropagation()}>
              <PrintButton
                onClick={() => setPrintSelectOpen(true)}
                title={`Seleccionar tickets a imprimir de ${spending.customer.name}`}
              />
            </div>
          )}

          {/* Chevron — solo si tiene tickets */}
          {hasTickets && (
            <Icon name="chevron-down" size={16} strokeWidth={2} className={`text-gray-400 transition-transform duration-200 shrink-0 ${collapsed ? '' : 'rotate-180'}`} />
          )}
        </div>
      </div>

      {/* ── Barra de progreso (siempre visible) ── */}
      <div className="px-4 pb-3">
        <div className="flex items-center gap-2">
          <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
            <div className="h-full bg-amber-400 rounded-full transition-all duration-300"
              style={{ width: `${pct}%` }} />
          </div>
          <span className="text-[10px] font-medium text-gray-400 tabular-nums shrink-0">
            {progressInBracket}/{threshold} Bs
          </span>
        </div>
      </div>

      {/* ── Lista de tickets (colapsable) ── */}
      {!collapsed && hasTickets && (
        <div className="border-t border-gray-200 px-4 pt-2 pb-3 space-y-0.5 bg-white/60">
          {customerTickets.map((t) => {
            const delivered     = isEffectivelyDelivered(t);
            const isToggling    = togglingId === t.id;
            const isWinnerTicket = t.winnerPosition !== undefined;
            return (
              <div key={t.id} className="flex items-center gap-2 rounded-lg px-1.5 py-1.5 hover:bg-white transition-colors">
                <span className={`font-mono font-bold text-xs w-9 shrink-0 ${isWinnerTicket ? 'text-amber-700' : 'text-gray-500'}`}>
                  #{t.ticketNumber}
                </span>
                <span className={`text-[10px] font-medium flex-1 ${
                  isWinnerTicket ? 'text-amber-700' : delivered ? 'text-emerald-600' : 'text-gray-400'
                }`}>
                  {isWinnerTicket
                    ? `★ ${positionLabel(t.winnerPosition!)}`
                    : delivered ? '✓ Entregado' : 'Pendiente'}
                </span>
                <button
                  onClick={() => handleToggle(t.id, !delivered)}
                  disabled={isToggling}
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-lg transition-colors disabled:opacity-40 ${
                    delivered
                      ? 'text-gray-400 hover:text-red-500 hover:bg-red-50'
                      : 'text-violet-600 hover:text-violet-700 hover:bg-violet-50'
                  }`}
                >
                  {isToggling ? '…' : delivered ? '↩ Revertir' : '✓ Entregar'}
                </button>
              </div>
            );
          })}
        </div>
      )}

      {printSelectOpen && (
        <PrintSelectModal
          tickets={customerTickets}
          customerName={spending.customer.name}
          localDelivered={localDelivered}
          localUndelivered={localUndelivered}
          raffleName={raffleName}
          printSettings={printSettings}
          onClose={() => setPrintSelectOpen(false)}
        />
      )}
    </div>
  );
}

// ─── Lista embebible (sin modal wrapper) ──────────────────────────────────────

export function ParticipantsList({ raffle, printSettings = { businessName: '' } }: { raffle: DetailRaffle; printSettings?: RaffleTicketPrintSettings }) {
  const [search, setSearch] = useState('');
  const [localDelivered, setLocalDelivered] = useState<Set<string>>(new Set());
  const [localUndelivered, setLocalUndelivered] = useState<Set<string>>(new Set());
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const q = search.toLowerCase().trim();
  const isSpending = raffle.ticketMode === 'SPENDING_THRESHOLD';

  const isEffectivelyDelivered = (ticketId: string, serverDelivered: boolean) =>
    (serverDelivered || localDelivered.has(ticketId)) && !localUndelivered.has(ticketId);

  const handleToggleDelivery = async (ticketId: string, deliver: boolean) => {
    try {
      if (deliver) {
        await rafflesApi.deliverTickets(raffle.id, [ticketId]);
        setLocalDelivered((prev) => new Set([...prev, ticketId]));
        setLocalUndelivered((prev) => { const next = new Set(prev); next.delete(ticketId); return next; });
        toast.success('Ticket entregado');
      } else {
        await rafflesApi.undeliverTickets(raffle.id, [ticketId]);
        setLocalUndelivered((prev) => new Set([...prev, ticketId]));
        setLocalDelivered((prev) => { const next = new Set(prev); next.delete(ticketId); return next; });
        toast.success('Entrega revertida');
      }
    } catch (err) {
      handleApiError(err, deliver ? 'Error al marcar como entregado' : 'Error al revertir entrega');
      throw err;
    }
  };

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

    const totalPending = (raffle.tickets ?? []).filter(
      (t) => !isEffectivelyDelivered(t.id, t.delivered),
    ).length;
    const totalTickets = (raffle.tickets ?? []).length;

    return (
      <div className="space-y-3">
        <SearchBox value={search} onChange={setSearch} />

        <div className="flex items-center justify-between">
          <p className="text-xs text-gray-400">
            {filtered.length === raffle.spendings.length
              ? `${raffle.spendings.length} cliente${raffle.spendings.length !== 1 ? 's' : ''}`
              : `${filtered.length} de ${raffle.spendings.length} clientes`}
          </p>
          <div className="flex items-center gap-2">
            {totalTickets > 0 && (
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                totalPending === 0
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-orange-50 text-orange-700 border border-orange-200'
              }`}>
                {totalPending === 0
                  ? '✓ Todos entregados'
                  : `${totalTickets - totalPending}/${totalTickets} entregados`}
              </span>
            )}
            <span className="inline-flex items-center gap-1 text-[10px] text-amber-700 bg-amber-50 border border-amber-100 px-2 py-0.5 rounded-full">
              <IconCoins className="w-3 h-3" />
              Cada {threshold} Bs = 1 ticket
            </span>
          </div>
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
                .map((t) => ({
                  id: t.id,
                  ticketNumber: t.ticketNumber,
                  delivered: t.delivered,
                  winnerPosition: winnerByTicket.get(t.id),
                }));
              return (
                <SpendingRow
                  key={s.customerId}
                  spending={s}
                  threshold={threshold}
                  isWinner={winnerByCustomer.has(s.customerId)}
                  winnerPosition={winnerByCustomer.get(s.customerId)}
                  customerTickets={customerTickets}
                  localDelivered={localDelivered}
                  localUndelivered={localUndelivered}
                  onToggleDelivery={handleToggleDelivery}
                  raffleName={raffle.name}
                  printSettings={printSettings}
                />
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // ── Vista por producto (PRODUCT_MATCH) — un ticket por fila ──────────────────

  const filtered = q
    ? raffle.tickets.filter(
        (t) =>
          t.customer.name.toLowerCase().includes(q) ||
          (t.customer.phone ?? '').toLowerCase().includes(q),
      )
    : raffle.tickets;

  const handleToggleTicket = async (ticketId: string, deliver: boolean) => {
    setTogglingId(ticketId);
    try {
      await handleToggleDelivery(ticketId, deliver);
    } finally {
      setTogglingId(null);
    }
  };

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
            const delivered = isEffectivelyDelivered(t.id, t.delivered);
            const isToggling = togglingId === t.id;
            return (
              <div key={t.id} className={`flex items-center gap-3 rounded-xl px-4 py-3 transition-colors ${
                win ? 'bg-amber-50 border border-amber-200' : 'bg-gray-50'
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
                <button
                  onClick={() => handleToggleTicket(t.id, !delivered)}
                  disabled={isToggling}
                  title={delivered ? 'Revertir entrega' : 'Marcar como entregado'}
                  className={`text-[10px] font-semibold px-2 py-1 rounded-lg transition-colors disabled:opacity-40 shrink-0 ${
                    delivered
                      ? 'text-gray-400 hover:text-red-500 hover:bg-red-50'
                      : 'text-violet-600 hover:text-violet-700 hover:bg-violet-50'
                  }`}
                >
                  {isToggling ? '…' : delivered ? '↩' : '✓ Entregar'}
                </button>
                <PrintButton
                  onClick={() =>
                    printRaffleTickets(
                      [{ ticketNumber: t.ticketNumber, customerName: t.customer.name }],
                      raffle.name,
                      printSettings,
                    )
                  }
                  title={`Imprimir ticket #${t.ticketNumber} de ${t.customer.name}`}
                />
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
