import type { ExpenseDto } from '@pos/shared';
import { expenseCategoryLabel, pluralUnit } from '../../utils/expense-labels';
import { bs } from '../report';

/** Une frases con ". " sin duplicar el punto de las que ya terminan en él ("Embol S.A."). */
export const sentences = (parts: (string | null | undefined)[]) =>
  (parts.filter(Boolean) as string[]).reduce(
    (text, part) => (text ? `${text}${text.endsWith('.') ? ' ' : '. '}${part}` : part),
    '',
  );

const fmtQty = (n: number) => (n % 1 === 0 ? String(n) : n.toFixed(3).replace(/0+$/, ''));

/** "6 kg a Bs 36.10": solo cuando el desglose aporta (hay unidad o más de una unidad). */
export function itemBreakdown(item: ExpenseDto['items'][number]): string | null {
  const qty = Number(item.quantity);
  if (qty === 1 && !item.unit) return null;
  const unit = item.unit ? ` ${pluralUnit(item.unit, qty)}` : '';
  return `${fmtQty(qty)}${unit} a ${bs(item.unitPrice)}`;
}

/** Qué se gastó: los ítems, o la nota o la categoría en gastos viejos sin ítems. */
export function expenseTitle(expense: ExpenseDto): string {
  return expense.items.length > 0
    ? expense.items.map((i) => i.name).join(', ')
    : (expense.description ?? expenseCategoryLabel(expense));
}
