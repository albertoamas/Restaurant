import type { ExpenseDto } from '@pos/shared';
import { Icon } from '../ui/Icon';

const LEGACY_LABELS: Record<string, string> = {
  SUPPLIES: 'Insumos', WAGES: 'Personal', UTILITIES: 'Servicios',
  TRANSPORT: 'Transporte', MAINTENANCE: 'Mantenimiento', OTHER: 'Otro',
};

/** Etiqueta visible: categoría del primer ítem, o la categoría legacy del gasto. */
export function expenseCategoryLabel(expense: ExpenseDto): string {
  const firstName = expense.items[0]?.categoryName;
  if (firstName) return firstName;
  return LEGACY_LABELS[expense.category] ?? expense.category;
}

interface ExpenseListProps {
  expenses: ExpenseDto[];
  deletingId: string | null;
  onEdit: (expense: ExpenseDto) => void;
  onConfirmDelete: (id: string) => void;
  onCancelDelete: () => void;
  onDelete: (id: string) => void;
}

const ROW_GRID = 'grid-cols-[52px_minmax(0,1fr)_74px_60px] gap-2.5 sm:grid-cols-[92px_1fr_110px_64px] sm:gap-4';

export function ExpenseList({
  expenses, deletingId, onEdit, onConfirmDelete, onCancelDelete, onDelete,
}: ExpenseListProps) {
  return (
    <div>
      <div className={`hidden border-b border-[var(--border-subtle)] bg-[var(--color-surface-2)] px-5 py-2.5 sm:grid ${ROW_GRID}`}>
        <Th>Fecha</Th>
        <Th>Detalle</Th>
        <Th align="right">Total</Th>
        <span />
      </div>

      {expenses.map((expense) => (
        <ExpenseRow
          key={expense.id}
          expense={expense}
          isDeleting={deletingId === expense.id}
          onEdit={() => onEdit(expense)}
          onConfirmDelete={() => onConfirmDelete(expense.id)}
          onCancelDelete={onCancelDelete}
          onDelete={() => onDelete(expense.id)}
        />
      ))}
    </div>
  );
}

function Th({ children, align = 'left' }: { children: React.ReactNode; align?: 'left' | 'right' }) {
  return (
    <span className={`text-[10px] font-bold uppercase tracking-wider text-gray-400 ${align === 'right' ? 'text-right' : ''}`}>
      {children}
    </span>
  );
}

function CategoryTag({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex shrink-0 items-center rounded-md border border-primary-500/20 bg-primary-500/10 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary-700">
      {children}
    </span>
  );
}

function ExpenseRow({
  expense, isDeleting, onEdit, onConfirmDelete, onCancelDelete, onDelete,
}: {
  expense: ExpenseDto;
  isDeleting: boolean;
  onEdit: () => void;
  onConfirmDelete: () => void;
  onCancelDelete: () => void;
  onDelete: () => void;
}) {
  const date     = new Date(expense.expenseDate);
  const dateStr  = date.toLocaleDateString('es-BO', { day: '2-digit', month: 'short' });
  const timeStr  = date.toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit' });
  const hasItems = expense.items.length > 0;
  const fallback = expenseCategoryLabel(expense);

  return (
    <div
      className={`group grid items-start border-t border-[var(--border-subtle)] px-3 py-3 transition-colors first:border-t-0 sm:px-5 sm:py-3.5 ${ROW_GRID} ${
        isDeleting ? 'bg-[var(--color-surface-2)]' : 'hover:bg-[var(--color-surface-2)]'
      }`}
    >
      <div className="flex flex-col pt-0.5">
        <span className="text-sm font-bold leading-tight text-gray-800">{dateStr}</span>
        <span className="mt-0.5 text-[11px] text-gray-400">{timeStr}</span>
      </div>

      <div className="min-w-0">
        {hasItems ? (
          <div className="space-y-1.5">
            {expense.items.map((item) => {
              const qty = Number(item.quantity);
              return (
                <div key={item.id} className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
                  <CategoryTag>{item.categoryName ?? fallback}</CategoryTag>
                  <span className="min-w-0 flex-1 truncate text-sm font-semibold text-gray-800">{item.name}</span>
                  {qty !== 1 && (
                    <span className="shrink-0 text-xs tabular-nums text-gray-400">
                      {qty % 1 === 0 ? qty : qty.toFixed(3)}{item.unit ? ` ${item.unit}` : ''} × Bs {item.unitPrice.toFixed(2)}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <CategoryTag>{fallback}</CategoryTag>
            {expense.description && <span className="truncate text-sm text-gray-700">{expense.description}</span>}
          </div>
        )}

        {hasItems && expense.description && (
          <div className="mt-1.5 flex items-center gap-1.5">
            <Icon name="chat" size={12} className="shrink-0 text-gray-300" />
            <p className="truncate text-xs italic text-gray-400">{expense.description}</p>
          </div>
        )}

        {(expense.supplierName || expense.documentNumber) && (
          <p className="mt-1.5 text-[11px] font-medium text-gray-400">
            {[expense.supplierName, expense.documentNumber ? `Comp. ${expense.documentNumber}` : null]
              .filter(Boolean)
              .join(' · ')}
          </p>
        )}
      </div>

      <div className="flex items-start justify-end pt-0.5">
        <span className="font-heading text-sm font-black tabular-nums leading-tight text-gray-900">
          Bs {expense.amount.toFixed(2)}
        </span>
      </div>

      {isDeleting ? (
        <div className="flex items-center justify-end gap-1 pt-0.5">
          <button
            onClick={onDelete}
            title="Confirmar anulación"
            className="flex h-7 w-7 items-center justify-center rounded-lg bg-red-600 text-white transition-opacity hover:opacity-90"
          >
            <Icon name="check" size={14} strokeWidth={2.5} />
          </button>
          <button
            onClick={onCancelDelete}
            title="Cancelar"
            className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-[var(--color-surface-3)] hover:text-gray-700"
          >
            <Icon name="x" size={14} strokeWidth={2.5} />
          </button>
        </div>
      ) : (
        <div className="flex items-center justify-end gap-0.5 pt-0.5 transition-opacity sm:opacity-0 sm:group-hover:opacity-100">
          <button
            onClick={onEdit}
            title="Editar gasto"
            className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-[var(--color-surface-3)] hover:text-primary-600"
          >
            <Icon name="edit" size={15} />
          </button>
          <button
            onClick={onConfirmDelete}
            title="Anular gasto"
            className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-[var(--color-surface-3)] hover:text-red-600"
          >
            <Icon name="trash" size={15} />
          </button>
        </div>
      )}
    </div>
  );
}
