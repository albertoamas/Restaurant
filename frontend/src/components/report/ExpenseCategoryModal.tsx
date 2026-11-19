import { useState } from 'react';
import type { ExpenseItemSummaryDto } from '@pos/shared';
import { Modal } from '../ui/Modal';
import { Skeleton } from '../ui/Skeleton';
import { Card } from '../ui/Card';
import { bs, share } from './index';
import { expenseItemName, expenseItemTags, type ExpenseItemGroup } from '../../utils/expense-items-report';

interface Props {
  label: string;
  /** Período del reporte, para el subtítulo ("Este mes", "1 al 15 de noviembre"...). */
  period: string;
  amount: number;
  /** Porcentaje de la categoría sobre el total gastado en el período. */
  pctOfTotal: number;
  group: ExpenseItemGroup | undefined;
  loading: boolean;
  onClose: () => void;
}

/** En qué se fue el dinero de una categoría: cada ítem con su monto, su peso y su precio promedio. */
export function ExpenseCategoryModal({ label, period, amount, pctOfTotal, group, loading, onClose }: Props) {
  const [showRest, setShowRest] = useState(false);
  const itemCount = group ? group.top.length + group.rest.length : 0;
  const visible   = group ? (showRest ? [...group.top, ...group.rest] : group.top) : [];

  return (
    <Modal isOpen onClose={onClose} title={label} size="lg">
      <p className="-mt-2 mb-4 text-label text-soft">{period}</p>

      {/* Un bloque y no tres tarjetas iguales: el monto es mucho más largo que "54%" y se salía de
          su cuadro. Si no entra todo en una fila, las dos cifras chicas pasan abajo. */}
      <Card padding="sm" className="mb-5">
        <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
          <div className="min-w-0">
            <p className="text-label text-soft">Gastado</p>
            <p className="mt-0.5 text-title font-bold font-heading tabular-nums text-main">{bs(amount)}</p>
          </div>
          <div className="flex gap-6">
            <Stat label="Del total" value={`${Math.round(pctOfTotal)}%`} />
            <Stat label="Ítems" value={loading ? '-' : String(itemCount)} />
          </div>
        </div>
      </Card>

      {loading ? (
        <div className="space-y-4"><Skeleton variant="rect" /><Skeleton variant="rect" /><Skeleton variant="rect" /></div>
      ) : visible.length === 0 ? (
        <p className="text-body text-soft">Sin detalle para esta categoría.</p>
      ) : (
        <ul className="space-y-5">
          {visible.map((item) => <ItemRow key={itemKey(item)} item={item} categoryTotal={amount} />)}
        </ul>
      )}

      {!loading && group && group.rest.length > 0 && !showRest && (
        <button
          type="button"
          onClick={() => setShowRest(true)}
          className="mt-5 w-full rounded-control border border-line bg-surface-2 px-4 py-2.5 text-body font-medium text-main transition-colors hover:bg-surface-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/60"
        >
          Ver {group.rest.length} más: {bs(group.restTotal)}
        </button>
      )}
    </Modal>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-label text-soft">{label}</p>
      <p className="mt-0.5 text-heading font-bold font-heading tabular-nums text-main">{value}</p>
    </div>
  );
}

const itemKey = (i: ExpenseItemSummaryDto) => `${i.conceptId ?? i.name ?? '-'}|${i.unit ?? ''}`;

/** Un ítem: nombre y monto, barra de su peso dentro de la categoría y sus datos en etiquetas. */
function ItemRow({ item, categoryTotal }: { item: ExpenseItemSummaryDto; categoryTotal: number }) {
  const pct = share(item.total, categoryTotal);
  return (
    <li>
      <div className="flex items-baseline justify-between gap-3">
        <span className={`min-w-0 truncate text-body font-medium ${item.name ? 'text-main' : 'italic text-soft'}`}>
          {expenseItemName(item)}
        </span>
        <span className="shrink-0 tabular-nums text-body font-semibold text-main">{bs(item.total)}</span>
      </div>
      <div className="mt-1.5 flex items-center gap-2">
        <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-surface-3">
          <div className="h-full rounded-full bg-rose-500" style={{ width: `${Math.min(pct, 100)}%` }} />
        </div>
        <span className="w-10 shrink-0 text-right text-caption tabular-nums text-muted">{Math.round(pct)}%</span>
      </div>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {expenseItemTags(item).map((tag) => (
          <span key={tag} className="rounded-full border border-line bg-surface-2 px-2.5 py-0.5 text-caption text-soft tabular-nums">
            {tag}
          </span>
        ))}
      </div>
    </li>
  );
}
