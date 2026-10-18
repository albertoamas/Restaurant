import { useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { EmptyState } from '../ui/EmptyState';
import { Icon } from '../ui/Icon';
import { Input } from '../ui/Input';
import type { DetailRaffle } from './types';
import { positionLabel } from '../../utils/raffle-utils';
import { rafflesApi } from '../../api/raffles.api';
import { handleApiError } from '../../utils/api-error';
import { printRaffleTickets, type RaffleTicketPrintSettings } from '../../utils/print';

/** Clientes por página: con cientos de tickets, la lista sigue siendo recorrible. */
const PAGE = 30;

interface Ticket { id: string; number: number; delivered: boolean; winnerPosition?: number }

interface Participant {
  customerId: string;
  name: string;
  phone: string | null;
  tickets: Ticket[];
  /** Solo en sorteos por monto: lo consumido que todavía no llega al próximo ticket. */
  progress?: number;
  winnerPositions: number[];
}

function ParticipantRow({ p, threshold, raffleName, printSettings, onDeliver }: {
  p: Participant;
  threshold: number | null;
  raffleName: string;
  printSettings: RaffleTicketPrintSettings;
  onDeliver: (ticketIds: string[], deliver: boolean) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const delivered = p.tickets.filter((t) => t.delivered).length;
  const pending = p.tickets.filter((t) => !t.delivered);
  const isWinner = p.winnerPositions.length > 0;

  const run = async (key: string, ids: string[], deliver: boolean) => {
    setBusy(key);
    try { await onDeliver(ids, deliver); } finally { setBusy(null); }
  };
  const print = (tickets: Ticket[]) =>
    printRaffleTickets(tickets.map((t) => ({ ticketNumber: t.number, customerName: p.name })), raffleName, printSettings);

  const summary = [
    p.tickets.length === 1 ? '1 ticket' : `${p.tickets.length} tickets`,
    p.tickets.length > 0 ? (delivered === p.tickets.length ? 'todos entregados' : delivered === 0 ? 'ninguno entregado' : `${delivered} entregados`) : null,
  ].filter(Boolean).join(', ');

  return (
    <li className={isWinner ? 'bg-amber-500/8' : ''}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-surface-2 focus-visible:outline-none focus-visible:bg-surface-2"
      >
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <p className="min-w-0 truncate text-body font-semibold text-main">{p.name}</p>
            {p.winnerPositions.map((pos) => <Badge key={pos} variant="warning">Ganó el {positionLabel(pos)}</Badge>)}
          </div>
          <p className="mt-0.5 text-caption text-muted">{[p.phone, summary].filter(Boolean).join('. ')}</p>
          {threshold !== null && p.progress !== undefined && (
            <div className="mt-1.5 flex items-center gap-2">
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-3">
                <div className="h-full rounded-full bg-primary-500" style={{ width: `${Math.min(100, (p.progress / threshold) * 100)}%` }} />
              </div>
              <span className="shrink-0 text-caption text-muted tabular-nums">Bs {p.progress.toFixed(0)} de {threshold} para el próximo</span>
            </div>
          )}
        </div>
        <Icon name="chevron-down" size={16} className={`shrink-0 text-muted transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="border-t border-line bg-surface-2 px-4 py-3">
          {p.tickets.length === 0 ? (
            <p className="text-label text-soft">Todavía no completó un ticket.</p>
          ) : (
            <>
              <div className="mb-2 flex flex-wrap gap-2">
                {pending.length > 0 && (
                  <Button size="sm" loading={busy === 'all'} onClick={() => run('all', pending.map((t) => t.id), true)}>
                    <Icon name="check" size={16} />
                    Entregar {pending.length === 1 ? 'el pendiente' : `los ${pending.length} pendientes`}
                  </Button>
                )}
                <Button size="sm" variant="secondary" onClick={() => print(p.tickets)}>
                  <Icon name="print" size={16} />
                  Imprimir {p.tickets.length === 1 ? 'el ticket' : 'todos'}
                </Button>
              </div>
              <ul className="divide-y divide-line rounded-control border border-line bg-surface-card">
                {p.tickets.map((t) => (
                  <li key={t.id} className="flex items-center gap-3 px-3 py-1.5">
                    <span className="w-14 shrink-0 text-label font-semibold text-main tabular-nums">#{t.number}</span>
                    <span className="min-w-0 flex-1 text-label">
                      {t.winnerPosition !== undefined
                        ? <span className="font-semibold text-amber-800 dark:text-amber-300">Ganó el {positionLabel(t.winnerPosition)}</span>
                        : t.delivered ? <span className="text-emerald-700 dark:text-emerald-300">Entregado</span> : <span className="text-muted">Sin entregar</span>}
                    </span>
                    <Button size="sm" variant="ghost" loading={busy === t.id} onClick={() => run(t.id, [t.id], !t.delivered)}>
                      {t.delivered ? 'Deshacer' : 'Entregar'}
                    </Button>
                    <button
                      type="button"
                      onClick={() => print([t])}
                      aria-label={`Imprimir ticket ${t.number}`}
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-control text-muted hover:bg-surface-2 hover:text-main"
                    >
                      <Icon name="print" size={16} />
                    </button>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      )}
    </li>
  );
}

/**
 * Participantes del sorteo agrupados por cliente, en los dos tipos de sorteo: cuántos tickets
 * tiene cada uno y cuántos se le entregaron; al tocarlo, sus tickets para entregar o imprimir.
 * Antes, en el sorteo por producto, había una fila por ticket y un cliente se repetía muchas veces.
 */
export function ParticipantsList({ raffle, printSettings = { businessName: '' }, onDeliveryChanged }: {
  raffle: DetailRaffle;
  printSettings?: RaffleTicketPrintSettings;
  /** Se llama tras marcar o deshacer una entrega, para releer el sorteo. */
  onDeliveryChanged: () => void;
}) {
  const [search, setSearch] = useState('');
  const [shown, setShown] = useState(PAGE);
  const isSpending = raffle.ticketMode === 'SPENDING_THRESHOLD';
  const threshold = isSpending ? (raffle.spendingThreshold ?? 1) : null;

  const participants = useMemo(() => {
    const winners = raffle.winners.filter((w) => !w.voided);
    const winnerByTicket = new Map(winners.map((w) => [w.ticketId, w.position]));
    const byCustomer = new Map<string, Participant>();
    const get = (c: { id: string; name: string; phone: string | null }) => {
      let p = byCustomer.get(c.id);
      if (!p) { p = { customerId: c.id, name: c.name, phone: c.phone, tickets: [], winnerPositions: [] }; byCustomer.set(c.id, p); }
      return p;
    };
    for (const s of raffle.spendings ?? []) {
      get(s.customer).progress = threshold ? s.totalSpent % threshold : undefined;
    }
    for (const t of raffle.tickets) {
      const pos = winnerByTicket.get(t.id);
      get(t.customer).tickets.push({ id: t.id, number: t.ticketNumber, delivered: t.delivered, winnerPosition: pos });
      if (pos !== undefined) get(t.customer).winnerPositions.push(pos);
    }
    return [...byCustomer.values()]
      .map((p) => ({ ...p, tickets: p.tickets.sort((a, b) => a.number - b.number), winnerPositions: p.winnerPositions.sort((a, b) => a - b) }))
      // Ganadores primero; después, los que más tickets tienen.
      .sort((a, b) => (Number(b.winnerPositions.length > 0) - Number(a.winnerPositions.length > 0)) || (b.tickets.length - a.tickets.length) || a.name.localeCompare(b.name, 'es'));
  }, [raffle, threshold]);

  const q = search.trim().toLowerCase();
  const filtered = q ? participants.filter((p) => p.name.toLowerCase().includes(q) || (p.phone ?? '').includes(q)) : participants;
  const visible = filtered.slice(0, shown);
  const totalTickets = raffle.tickets.length;
  const deliveredTickets = participants.reduce((n, p) => n + p.tickets.filter((t) => t.delivered).length, 0);

  const handleDeliver = async (ids: string[], deliver: boolean) => {
    try {
      if (deliver) await rafflesApi.deliverTickets(raffle.id, ids);
      else         await rafflesApi.undeliverTickets(raffle.id, ids);
      onDeliveryChanged();
      toast.success(deliver ? (ids.length === 1 ? 'Ticket entregado' : `${ids.length} tickets entregados`) : 'Entrega deshecha');
    } catch (err) {
      handleApiError(err, deliver ? 'Error al marcar como entregado' : 'Error al deshacer la entrega');
    }
  };

  return (
    <div>
      <div className="flex flex-col gap-2 px-4 pb-3 sm:flex-row sm:items-center sm:px-5">
        <div className="flex-1">
          <Input
            aria-label="Buscar participante"
            placeholder="Buscar por nombre o teléfono"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setShown(PAGE); }}
            leftAddon={<Icon name="search" size={18} />}
          />
        </div>
        {totalTickets > 0 && (
          <p className="text-label text-soft sm:text-right">
            {deliveredTickets === totalTickets ? 'Todos los tickets entregados' : `${deliveredTickets} de ${totalTickets} tickets entregados`}
          </p>
        )}
      </div>

      {participants.length === 0 ? (
        <EmptyState
          compact
          icon="users"
          title="Todavía no hay participantes"
          description={isSpending ? 'Los clientes aparecen al consumir con su nombre asignado en el pedido.' : 'Los tickets se generan al vender el producto del sorteo a un cliente.'}
        />
      ) : filtered.length === 0 ? (
        <EmptyState compact icon="search" title={`Nadie con "${search.trim()}"`} />
      ) : (
        <>
          <ul className="divide-y divide-line border-t border-line">
            {visible.map((p) => (
              <ParticipantRow
                key={p.customerId}
                p={p}
                threshold={threshold}
                raffleName={raffle.name}
                printSettings={printSettings}
                onDeliver={handleDeliver}
              />
            ))}
          </ul>
          <div className="flex flex-col items-center gap-2 border-t border-line px-4 py-3">
            <p className="text-label text-soft">Mostrando {visible.length} de {filtered.length} {filtered.length === 1 ? 'cliente' : 'clientes'}</p>
            {filtered.length > visible.length && (
              <Button variant="secondary" size="sm" onClick={() => setShown((n) => n + PAGE)}>Ver más</Button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
