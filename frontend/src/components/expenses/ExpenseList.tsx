import type { ExpenseDto } from '@pos/shared';
import { ActionMenu } from '../ui/ActionMenu';
import { formatBoliviaDateShort, formatBoliviaTime } from '../../utils/date';
import { expenseCategoryLabel, pluralUnit } from '../../utils/expense-labels';
import { useAuth } from '../../context/auth.context';
import { useBranchNames } from '../../hooks/useBranches';

interface ExpenseListProps {
  expenses: ExpenseDto[];
  onEdit: (expense: ExpenseDto) => void;
  /** Pide confirmación antes de anular (la confirmación vive en la página). */
  onVoid: (expense: ExpenseDto) => void;
}

/** Une frases con ". " sin duplicar el punto de las que ya terminan en él ("Embol S.A."). */
const sentences = (parts: (string | null | undefined)[]) =>
  (parts.filter(Boolean) as string[]).reduce(
    (text, part) => (text ? `${text}${text.endsWith('.') ? ' ' : '. '}${part}` : part),
    '',
  );

const fmtQty = (n: number) => (n % 1 === 0 ? String(n) : n.toFixed(3).replace(/0+$/, ''));

/** "6 kg a Bs 36.10": solo cuando el desglose aporta (hay unidad o más de una unidad). */
function breakdown(item: ExpenseDto['items'][number]): string | null {
  const qty = Number(item.quantity);
  if (qty === 1 && !item.unit) return null;
  const unit = item.unit ? ` ${pluralUnit(item.unit, qty)}` : '';
  return `${fmtQty(qty)}${unit} a Bs ${item.unitPrice.toFixed(2)}`;
}

/**
 * Movimientos del período: qué se gastó y cuánto arriba, y en una sola línea de apoyo la
 * categoría, cuándo y el detalle (cantidad, proveedor, comprobante, nota).
 */
export function ExpenseList({ expenses, onEdit, onVoid }: ExpenseListProps) {
  const { currentBranchId } = useAuth();
  const { branchName } = useBranchNames();

  return (
    <ul className="divide-y divide-line">
      {expenses.map((expense) => {
        const items    = expense.items;
        const category = expenseCategoryLabel(expense);
        const title    = items.length > 0 ? items.map((i) => i.name).join(', ') : (expense.description ?? category);
        // Solo en la vista consolidada: con una sucursal fija la etiqueta es ruido.
        const branch   = currentBranchId === null ? branchName(expense.branchId) : null;

        const meta = sentences([
          category,
          `${formatBoliviaDateShort(expense.expenseDate)}, ${formatBoliviaTime(expense.expenseDate)}`,
          branch,
        ]);

        const details = sentences([
          ...items.map((i) => {
            const b = breakdown(i);
            return b && items.length > 1 ? `${i.name}: ${b}` : b;
          }),
          expense.supplierName,
          expense.documentNumber ? `Comprobante ${expense.documentNumber}` : null,
          items.length > 0 && expense.description ? `Nota: ${expense.description}` : null,
        ]);

        return (
          <li key={expense.id} className="flex items-start gap-2 px-4 py-3 sm:px-5 hover:bg-surface-2 transition-colors">
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline justify-between gap-3">
                <p className="min-w-0 truncate text-body font-semibold text-main">{title}</p>
                <p className="shrink-0 text-body font-bold text-main tabular-nums">Bs {expense.amount.toFixed(2)}</p>
              </div>
              <p className="mt-0.5 text-caption text-muted">{meta}</p>
              {details && <p className="mt-0.5 text-caption text-soft">{details}</p>}
            </div>
            <ActionMenu
              label={`Más acciones del gasto ${title}`}
              items={[
                { label: 'Editar gasto', icon: 'edit', onSelect: () => onEdit(expense) },
                { label: 'Anular gasto', icon: 'ban', onSelect: () => onVoid(expense), danger: true },
              ]}
            />
          </li>
        );
      })}
    </ul>
  );
}
