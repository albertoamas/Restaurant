import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { PaymentMethod } from '@pos/shared';
import type { ExpenseCategoryDto, ExpenseDto } from '@pos/shared';
import { expensesApi } from '../../api/expenses.api';
import { useExpenseCategories } from '../../hooks/useExpenses';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Icon } from '../ui/Icon';
import { handleApiError } from '../../utils/api-error';
import { useAuth } from '../../context/auth.context';
import { today } from '../../utils/date';
import { toBoliviaDateString } from '../../utils/timezone';

type ItemMode = 'simple' | 'detailed';

interface ItemRow {
  key: number;
  categoryId: string;
  name: string;
  unit: string;
  mode: ItemMode;
  amount: string;
  quantity: string;
  unitPrice: string;
}

interface ExpenseFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  expense?: ExpenseDto;
}

let rowKey = 0;

function newRow(categoryId = ''): ItemRow {
  return { key: ++rowKey, categoryId, name: '', unit: '', mode: 'simple', amount: '', quantity: '', unitPrice: '' };
}

function rowFromItem(item: ExpenseDto['items'][number], categories: ExpenseCategoryDto[]): ItemRow {
  const cat = categories.find((c) => c.id === item.categoryId);
  const isSimple = item.quantity === 1 && !(cat?.trackQuantity);
  return {
    key:        ++rowKey,
    categoryId: item.categoryId ?? '',
    name:       item.name,
    unit:       item.unit ?? '',
    mode:       isSimple ? 'simple' : 'detailed',
    amount:     isSimple ? String(item.unitPrice) : String(item.totalPrice),
    quantity:   String(item.quantity),
    unitPrice:  String(item.unitPrice),
  };
}

function rowTotal(row: ItemRow): number {
  if (row.mode === 'simple') return parseFloat(row.amount) || 0;
  const qty   = parseFloat(row.quantity)  || 0;
  const price = parseFloat(row.unitPrice) || 0;
  return Math.round(qty * price * 100) / 100;
}

export function ExpenseFormModal({ isOpen, onClose, onSaved, expense }: ExpenseFormModalProps) {
  const { currentBranchId } = useAuth();
  const { categories, loading: catLoading } = useExpenseCategories();

  const [items, setItems]             = useState<ItemRow[]>([newRow()]);
  const [description, setDescription] = useState('');
  const [expenseDate, setExpenseDate] = useState(today());
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PaymentMethod.CASH);
  const [supplierName, setSupplierName] = useState('');
  const [documentNumber, setDocumentNumber] = useState('');
  const [loading, setLoading]         = useState(false);

  const isEditing = !!expense;

  useEffect(() => {
    if (!isOpen) return;
    if (expense) {
      setItems(expense.items.length > 0 ? expense.items.map((i) => rowFromItem(i, categories)) : [newRow()]);
      setDescription(expense.description ?? '');
      setExpenseDate(toBoliviaDateString(new Date(expense.expenseDate)));
      setPaymentMethod(expense.paymentMethod ?? PaymentMethod.CASH);
      setSupplierName(expense.supplierName ?? '');
      setDocumentNumber(expense.documentNumber ?? '');
    } else {
      setItems([newRow()]);
      setDescription('');
      setExpenseDate(today());
      setPaymentMethod(PaymentMethod.CASH);
      setSupplierName('');
      setDocumentNumber('');
    }
  }, [isOpen, expense]);

  const handleClose = () => {
    setItems([newRow()]);
    setDescription('');
    setExpenseDate(today());
    setPaymentMethod(PaymentMethod.CASH);
    setSupplierName('');
    setDocumentNumber('');
    onClose();
  };

  const updateItem = (key: number, patch: Partial<ItemRow>) =>
    setItems((prev) => prev.map((r) => (r.key === key ? { ...r, ...patch } : r)));

  const addItem = () =>
    setItems((prev) => [...prev, newRow()]);

  const removeItem = (key: number) =>
    setItems((prev) => (prev.length > 1 ? prev.filter((r) => r.key !== key) : prev));

  const totalAmount = items.reduce((sum, r) => sum + rowTotal(r), 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    for (const row of items) {
      if (!row.name.trim()) { toast.error('Todos los ítems deben tener nombre'); return; }
      if (row.mode === 'simple') {
        const v = parseFloat(row.amount);
        if (!v || v <= 0) { toast.error('El monto debe ser mayor a 0'); return; }
      } else {
        const qty   = parseFloat(row.quantity);
        const price = parseFloat(row.unitPrice);
        if (!qty   || qty   <= 0) { toast.error('La cantidad debe ser mayor a 0');       return; }
        if (!price || price <= 0) { toast.error('El precio unitario debe ser mayor a 0'); return; }
      }
    }

    const payload = {
      items: items.map((r) => ({
        categoryId: r.categoryId || undefined,
        name:       r.name.trim(),
        unit:       r.unit.trim() || undefined,
        quantity:   r.mode === 'simple' ? 1 : parseFloat(r.quantity),
        unitPrice:  r.mode === 'simple' ? parseFloat(r.amount) : parseFloat(r.unitPrice),
      })),
      description: description.trim() || undefined,
      expenseDate,
      paymentMethod,
      supplierName: supplierName.trim() || undefined,
      documentNumber: documentNumber.trim() || undefined,
    };

    setLoading(true);
    try {
      if (isEditing && expense) {
        await expensesApi.update(expense.id, payload);
        toast.success('Gasto actualizado');
      } else {
        await expensesApi.create({ ...payload, branchId: currentBranchId ?? undefined });
        toast.success('Gasto registrado');
      }
      onSaved();
      handleClose();
    } catch (err) {
      handleApiError(err, isEditing ? 'Error al actualizar gasto' : 'Error al registrar gasto');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={isEditing ? 'Editar Gasto' : 'Registrar Gasto'}
      size="3xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">

        <div className="rounded-2xl border border-amber-200/70 bg-amber-50/70 p-4">
          <div className="mb-3 flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500 text-white">
              <Icon name="receipt" size={14} strokeWidth={2.2} />
            </span>
            <div>
              <p className="text-sm font-bold text-gray-900">Datos del gasto</p>
              <p className="text-[11px] text-gray-500">La fecha puede ser distinta al momento de registro.</p>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Field label="Fecha del gasto">
              <input type="date" required value={expenseDate} onChange={(e) => setExpenseDate(e.target.value)} className={FIELD_CLASS} />
            </Field>
            <Field label="Forma de pago">
              <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)} className={FIELD_CLASS}>
                <option value={PaymentMethod.CASH}>Efectivo</option>
                <option value={PaymentMethod.QR}>QR</option>
                <option value={PaymentMethod.TRANSFER}>Transferencia</option>
                <option value={PaymentMethod.CORTESIA}>Cortesía / ajuste</option>
              </select>
            </Field>
            <Field label="Proveedor" optional>
              <input value={supplierName} onChange={(e) => setSupplierName(e.target.value)} placeholder="Ej. Mercado central" className={FIELD_CLASS} maxLength={150} />
            </Field>
            <Field label="Comprobante" optional>
              <input value={documentNumber} onChange={(e) => setDocumentNumber(e.target.value)} placeholder="Nº factura o recibo" className={FIELD_CLASS} maxLength={80} />
            </Field>
          </div>
        </div>

        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="text-sm font-bold text-gray-900">Detalle</p>
            <p className="text-xs text-gray-400">Agrupa en un solo registro todo lo comprado en el mismo comprobante.</p>
          </div>
          <span className="rounded-full bg-gray-100 px-2.5 py-1 text-[11px] font-semibold text-gray-500">{items.length} {items.length === 1 ? 'ítem' : 'ítems'}</span>
        </div>

        <div className="space-y-2">
          {items.map((row, idx) => (
            <ItemRowForm
              key={row.key}
              row={row}
              index={idx}
              categories={categories}
              catLoading={catLoading}
              onChange={(patch) => updateItem(row.key, patch)}
              onRemove={() => removeItem(row.key)}
              canRemove={items.length > 1}
            />
          ))}
        </div>

        <button
          type="button"
          onClick={addItem}
          className="flex items-center gap-1.5 text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors"
        >
          <Icon name="plus" size={16} strokeWidth={2} />
          Agregar ítem
        </button>

        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 px-4 py-3 flex items-center justify-between">
          <span className="text-sm font-semibold text-gray-500">Total del gasto</span>
          <span className="font-heading font-black text-xl text-emerald-800">
            Bs {totalAmount.toFixed(2)}
          </span>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1.5">
            Notas <span className="font-normal text-gray-400">(opcional)</span>
          </label>
          <input
            placeholder="Ej: Compra semanal de insumos"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full border border-[var(--border-subtle)] rounded-xl px-3 py-2 text-sm bg-[var(--color-surface-card)] text-gray-700
              focus:outline-none focus:ring-[3px] focus:ring-primary-500/20 focus:border-primary-500
              transition-[border-color,box-shadow] placeholder:text-gray-300"
          />
        </div>

        <div className="flex gap-3 pt-1">
          <Button type="button" variant="secondary" fullWidth onClick={handleClose}>
            Cancelar
          </Button>
          <Button type="submit" fullWidth loading={loading}>
            {isEditing ? 'Guardar cambios' : 'Guardar Gasto'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

const FIELD_CLASS = 'w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-800 outline-none transition focus:border-amber-400 focus:ring-[3px] focus:ring-amber-400/15 placeholder:text-gray-300';

function Field({ label, optional, children }: { label: string; optional?: boolean; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.08em] text-gray-500">
        {label}{optional && <span className="ml-1 font-medium normal-case tracking-normal text-gray-300">opcional</span>}
      </span>
      {children}
    </label>
  );
}

function ItemRowForm({
  row,
  index,
  categories,
  catLoading,
  onChange,
  onRemove,
  canRemove,
}: {
  row: ItemRow;
  index: number;
  categories: ExpenseCategoryDto[];
  catLoading: boolean;
  onChange: (patch: Partial<ItemRow>) => void;
  onRemove: () => void;
  canRemove: boolean;
}) {
  const total = rowTotal(row);

  const inputBase =
    'border border-[var(--border-subtle)] rounded-xl px-2.5 py-2 text-sm bg-[var(--color-surface-card)] text-gray-700 ' +
    'focus:outline-none focus:ring-[3px] focus:ring-primary-500/20 focus:border-primary-500 ' +
    'transition-[border-color,box-shadow]';

  return (
    <div className="grid grid-cols-1 items-end gap-2 rounded-2xl border border-[var(--border-subtle)] bg-[var(--color-surface-2)] p-3 md:grid-cols-[150px_minmax(150px,1fr)_minmax(230px,auto)_32px]">

      {/* Category */}
      <select
        value={row.categoryId}
        onChange={(e) => {
          const cat = categories.find((c) => c.id === e.target.value);
          const mode: ItemMode = cat?.trackQuantity ? 'detailed' : 'simple';
          onChange({ categoryId: e.target.value, mode });
        }}
        disabled={catLoading}
        className={`${inputBase} w-full disabled:opacity-50`}
      >
        <option value="">Sin categoría</option>
        {categories.map((c) => (
          <option key={c.id} value={c.id}>{c.name}</option>
        ))}
      </select>

      {/* Name */}
      <input
        autoFocus={index === 0}
        placeholder="Nombre del ítem"
        value={row.name}
        onChange={(e) => onChange({ name: e.target.value })}
        className={`${inputBase} w-full min-w-0 placeholder:text-gray-300`}
        required
      />

      {/* Amount section */}
      {row.mode === 'simple' ? (
        <div className="flex items-center gap-1.5 md:justify-end">
          <span className="text-xs font-medium text-gray-400">Bs</span>
          <input
            type="number"
            min="0.01"
            step="0.01"
            placeholder="0.00"
            value={row.amount}
            onChange={(e) => onChange({ amount: e.target.value })}
            className={`${inputBase} w-full md:w-32 text-right`}
            required
          />
        </div>
      ) : (
        <div className="grid grid-cols-[72px_58px_92px_auto] items-center gap-1 text-sm md:justify-end">
          <input
            type="number"
            min="0.001"
            step="0.001"
            placeholder="Cant."
            value={row.quantity}
            onChange={(e) => onChange({ quantity: e.target.value })}
            className={`${inputBase} w-20 text-left`}
            required
          />
          <input
            placeholder="Unidad"
            value={row.unit}
            onChange={(e) => onChange({ unit: e.target.value })}
            className={`${inputBase} w-full px-2 text-left`}
            maxLength={20}
          />
          <input
            type="number"
            min="0.01"
            step="0.01"
            placeholder="P. unit."
            value={row.unitPrice}
            onChange={(e) => onChange({ unitPrice: e.target.value })}
            className={`${inputBase} w-28 text-left`}
            required
          />
          <div className="w-[88px] rounded-xl border border-[var(--border-subtle)] bg-[var(--color-surface-2)] px-2.5 py-2 text-sm text-right font-semibold text-gray-700 tabular-nums">
            {total > 0
              ? `Bs ${total.toFixed(2)}`
              : <span className="text-gray-300 font-normal">—</span>}
          </div>
        </div>
      )}

      {/* Remove */}
      {canRemove ? (
        <button
          type="button"
          onClick={onRemove}
          className="w-7 h-7 shrink-0 flex items-center justify-center rounded-lg text-gray-300
            hover:text-red-500 hover:bg-red-500/8 transition-colors"
        >
          <Icon name="x" size={14} strokeWidth={2} />
        </button>
      ) : (
        <div className="w-7 shrink-0" />
      )}
    </div>
  );
}
