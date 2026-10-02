import type { CashSessionDto } from '@pos/shared';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Icon } from '../ui/Icon';
import { useNow } from '../../hooks/useNow';
import { durationLabel, formatBoliviaDayMonth, formatBoliviaTime, minutesBetween, today } from '../../utils/date';
import { toBoliviaDateString } from '../../utils/timezone';
import { Notice } from '../ui/Notice';
import { bs } from '../../utils/money';

function Figure({ label, value, highlight = false }: { label: string; value: number; highlight?: boolean }) {
  return (
    // El esperado ocupa la fila entera en celular: es la cifra que importa al cerrar.
    <div className={highlight ? 'max-sm:col-span-2 rounded-card bg-emerald-500/10 border border-emerald-500/25 px-4 py-3' : 'px-4 py-3 rounded-card bg-surface-2 border border-line'}>
      <dt className={`text-label ${highlight ? 'text-emerald-800 dark:text-emerald-300 font-semibold' : 'text-soft'}`}>{label}</dt>
      <dd className="mt-0.5 text-heading sm:text-title font-bold text-main font-heading tabular-nums whitespace-nowrap">{bs(value)}</dd>
    </div>
  );
}

interface OpenShiftProps {
  session: CashSessionDto;
  /** El dueño ve el esperado y cierra; el cajero solo ve el inicial y las ventas en efectivo. */
  isOwner: boolean;
  onClose: () => void;
}

/** Turno abierto: desde cuándo, quién lo abrió y cuánto efectivo debería haber ahora. */
export function OpenShift({ session, isOwner, onClose }: OpenShiftProps) {
  const now = useNow();
  const cashSales = session.cashSales ?? 0;
  const expected = session.openingAmount + cashSales;
  const openedDay = toBoliviaDateString(new Date(session.openedAt));
  const fromPreviousDay = openedDay < today();

  return (
    <Card>
      <p className="text-body text-main">
        Abierta el {formatBoliviaDayMonth(session.openedAt)} a las {formatBoliviaTime(session.openedAt)}
        {session.openedByName && <span className="text-soft"> por {session.openedByName}</span>}
      </p>
      <p className="text-label text-soft mt-0.5 inline-flex items-center gap-1">
        <Icon name="clock" size={14} />
        Hace {durationLabel(minutesBetween(session.openedAt, now))}
      </p>

      {fromPreviousDay && (
        <Notice className="mt-4">
          La caja está abierta desde el {formatBoliviaDayMonth(session.openedAt)}.
          {isOwner ? ' Ciérrala para que el conteo de hoy empiece limpio.' : ' Avisa al administrador para que la cierre.'}
        </Notice>
      )}

      <dl className={`mt-4 grid grid-cols-2 gap-3 ${isOwner ? 'sm:grid-cols-3' : ''}`}>
        <Figure label="Monto inicial" value={session.openingAmount} />
        <Figure label="Ventas en efectivo" value={cashSales} />
        {isOwner && <Figure label="Esperado en caja ahora" value={expected} highlight />}
      </dl>

      {session.notes && <p className="mt-3 text-label text-soft">Nota: {session.notes}</p>}

      <div className="mt-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <p className="text-label text-muted">Se actualiza con cada pedido cobrado en efectivo.</p>
        {isOwner ? (
          <Button size="lg" className="w-full sm:w-auto" onClick={onClose}>
            <Icon name="check" size={18} />
            Cerrar caja
          </Button>
        ) : (
          <p className="text-label text-soft">El administrador cierra la caja al terminar el turno.</p>
        )}
      </div>
    </Card>
  );
}

/** Caja cerrada: qué hacer para empezar el turno. */
export function ClosedShift({ isOwner, onOpen }: { isOwner: boolean; onOpen: () => void }) {
  return (
    <Card>
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <span className="w-12 h-12 shrink-0 rounded-card bg-surface-2 border border-line flex items-center justify-center text-muted">
          <Icon name="cash" size={24} />
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-body font-semibold text-main">No hay un turno abierto</p>
          <p className="text-label text-soft mt-0.5">
            {isOwner
              ? 'Abre la caja al empezar el turno con el efectivo que tiene el cajón.'
              : 'El administrador abre la caja al inicio del día.'}
          </p>
        </div>
        {isOwner && (
          <Button size="lg" className="w-full sm:w-auto" onClick={onOpen}>
            Abrir caja
          </Button>
        )}
      </div>
    </Card>
  );
}
