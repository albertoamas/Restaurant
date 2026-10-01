import type { ExpenseDto } from '@pos/shared';
import { bs } from '../report';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Icon } from '../ui/Icon';
import { formatBoliviaTime, formatWeekdayDay } from '../../utils/date';
import { toBoliviaDateString } from '../../utils/timezone';
import { expenseCategoryLabel } from '../../utils/expense-labels';
import { useBranchNames } from '../../hooks/useBranches';
import { expenseTitle, itemBreakdown } from './expense-text';

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-2">
      <dt className="text-label text-soft">{label}</dt>
      <dd className="text-body text-main text-right min-w-0">{value}</dd>
    </div>
  );
}

/** Todo sobre un gasto y sus acciones: la lista solo muestra lo esencial de cada uno. */
export function ExpenseDetailSheet({ expense, onClose, onEdit, onVoid }: {
  expense: ExpenseDto | null;
  onClose: () => void;
  onEdit: (expense: ExpenseDto) => void;
  onVoid: (expense: ExpenseDto) => void;
}) {
  const { branchName } = useBranchNames();
  if (!expense) return null;

  const day = toBoliviaDateString(new Date(expense.expenseDate));
  const items = expense.items;

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={expenseTitle(expense)}
      size="sm"
      footer={
        <div className="flex gap-3">
          <Button variant="secondary" fullWidth onClick={() => onVoid(expense)}>
            <Icon name="ban" size={18} />
            Anular
          </Button>
          <Button fullWidth onClick={() => onEdit(expense)}>
            <Icon name="edit" size={18} />
            Editar
          </Button>
        </div>
      }
    >
      <p className="text-display font-bold text-main font-heading tabular-nums">{bs(expense.amount)}</p>
      <dl className="mt-3 divide-y divide-line border-t border-line">
        <Row label="Categoría" value={expenseCategoryLabel(expense)} />
        <Row label="Fecha" value={`${formatWeekdayDay(day)}, ${formatBoliviaTime(expense.expenseDate)}`} />
        {branchName(expense.branchId) && <Row label="Sucursal" value={branchName(expense.branchId) as string} />}
        {items.map((i) => {
          const b = itemBreakdown(i);
          // Con un solo ítem sin cantidad, el detalle repetiría el monto de arriba.
          if (items.length === 1 && !b) return null;
          return <Row key={i.id} label={items.length > 1 ? i.name : 'Detalle'} value={b ?? bs(i.totalPrice)} />;
        })}
        {expense.supplierName && <Row label="Proveedor" value={expense.supplierName} />}
        {expense.documentNumber && <Row label="Comprobante" value={expense.documentNumber} />}
        {items.length > 0 && expense.description && <Row label="Nota" value={expense.description} />}
      </dl>
    </Modal>
  );
}
