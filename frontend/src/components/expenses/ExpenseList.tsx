import type { ExpenseDto } from '@pos/shared';
import { bs } from '../../utils/money';
import { Icon } from '../ui/Icon';
import { formatBoliviaTime, formatWeekdayDay } from '../../utils/date';
import { toBoliviaDateString } from '../../utils/timezone';
import { expenseCategoryLabel } from '../../utils/expense-labels';
import { useAuth } from '../../context/auth.context';
import { useBranchNames } from '../../hooks/useBranches';
import { expenseTitle, itemBreakdown, sentences } from './expense-text';

interface ExpenseListProps {
  expenses: ExpenseDto[];
  /** Tocar un gasto abre su detalle, con editar y anular. */
  onOpen: (expense: ExpenseDto) => void;
  /** Agrupar por día, con un encabezado por día. */
  grouped?: boolean;
  /**
   * Total de cada día del período completo (del resumen): el encabezado muestra lo gastado ese
   * día aunque la lista no haya cargado todos sus movimientos. Con filtros no sirve (mezcla
   * categorías): sin él, el total del día es la suma de lo cargado.
   */
  byDay?: Record<string, number>;
}

function Row({ expense, onOpen }: { expense: ExpenseDto; onOpen: () => void }) {
  const { currentBranchId } = useAuth();
  const { branchName } = useBranchNames();
  // Solo en la vista consolidada: con una sucursal fija la etiqueta es ruido.
  const branch = currentBranchId === null ? branchName(expense.branchId) : null;
  const items = expense.items;
  const detail = sentences([
    expenseCategoryLabel(expense),
    branch,
    ...items.map((i) => {
      const b = itemBreakdown(i);
      return b && items.length > 1 ? `${i.name}: ${b}` : b;
    }),
    expense.supplierName,
  ]);

  return (
    <li>
      <button
        type="button"
        onClick={onOpen}
        className="flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-surface-2 focus-visible:outline-none focus-visible:bg-surface-2 sm:px-5"
      >
        <span className="hidden sm:block w-20 shrink-0 pt-0.5 whitespace-nowrap text-caption text-muted tabular-nums">{formatBoliviaTime(expense.expenseDate)}</span>
        <span className="min-w-0 flex-1">
          <span className="flex items-baseline justify-between gap-3">
            <span className="min-w-0 truncate text-body font-semibold text-main">{expenseTitle(expense)}</span>
            <span className="shrink-0 text-body font-bold text-main tabular-nums">{bs(expense.amount)}</span>
          </span>
          <span className="mt-0.5 block truncate text-caption text-soft">
            {/* En celular la hora va aquí: su columna le quitaba espacio al nombre. */}
            <span className="sm:hidden">{sentences([formatBoliviaTime(expense.expenseDate), detail])}</span>
            <span className="hidden sm:inline">{detail}</span>
          </span>
        </span>
        <Icon name="chevron-right" size={16} className="mt-1 hidden shrink-0 text-muted sm:block" />
      </button>
    </li>
  );
}

/** Movimientos agrupados por día, con el total de cada día en su encabezado. */
export function ExpenseList({ expenses, onOpen, grouped = false, byDay }: ExpenseListProps) {
  if (!grouped) {
    return (
      <ul className="divide-y divide-line">
        {expenses.map((e) => <Row key={e.id} expense={e} onOpen={() => onOpen(e)} />)}
      </ul>
    );
  }

  const groups: { day: string; items: ExpenseDto[] }[] = [];
  for (const e of expenses) {
    const day = toBoliviaDateString(new Date(e.expenseDate));
    const last = groups[groups.length - 1];
    if (last?.day === day) last.items.push(e);
    else groups.push({ day, items: [e] });
  }

  return (
    <div>
      {groups.map((g) => (
        <section key={g.day} aria-label={formatWeekdayDay(g.day)}>
          <h3 className="flex items-baseline justify-between gap-3 border-y border-line bg-surface-2 px-4 py-2 text-label font-semibold text-main sm:px-5">
            <span>{formatWeekdayDay(g.day)}</span>
            <span className="tabular-nums">{bs(byDay?.[g.day] ?? g.items.reduce((n, e) => n + e.amount, 0))}</span>
          </h3>
          <ul className="divide-y divide-line">
            {g.items.map((e) => <Row key={e.id} expense={e} onOpen={() => onOpen(e)} />)}
          </ul>
        </section>
      ))}
    </div>
  );
}
