import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import type { ExpenseCategoryDto, ExpenseDto } from '@pos/shared';
import { expensesApi } from '../../api/expenses.api';
import { useExpenseCategories } from '../../hooks/useExpenses';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Icon } from '../ui/Icon';
import { handleApiError } from '../../utils/api-error';
import { useAuth } from '../../context/auth.context';

type ItemMode = 'simple' | 'detailed';

interface ItemRow {
  key: number;
  categoryId: string;
  name: string;
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
  return { key: ++rowKey, categoryId, name: '', mode: 'simple', amount: '', quantity: '', unitPrice: '' };
}

function rowFromItem(item: ExpenseDto['items'][number], categories: ExpenseCategoryDto[]): ItemRow {
  const cat = categories.find((c) => c.id === item.categoryId);
  const isSimple = item.quantity === 1 && !(cat?.trackQuantity);
  return {
    key:        ++rowKey,
    categoryId: item.categoryId ?? '',
    name:       item.name,
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
  const [loading, setLoading]         = useState(false);

  const isEditing = !!expense;

  useEffect(() => {
    if (!isOpen) return;
    if (expense) {
      setItems(expense.items.length > 0 ? expense.items.map((i) => rowFromItem(i, categories)) : [newRow()]);
      setDescription(expense.description ?? '');
    } else {
      setItems([newRow()]);
      setDescription('');
    }
  }, [isOpen, expense]);

  const handleClose = () => {
    setItems([newRow()]);
    setDescription('');
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
        quantity:   r.mode === 'simple' ? 1 : parseFloat(r.quantity),
        unitPrice:  r.mode === 'simple' ? parseFloat(r.amount) : parseFloat(r.unitPrice),
      })),
      description: description.trim() || undefined,
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

        <div className="border-t border-gray-100 pt-4 flex items-center justify-between">
          <span className="text-sm font-semibold text-gray-500">Total del gasto</span>
          <span className="font-heading font-black text-xl text-gray-900">
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
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white
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
    'border border-gray-200 rounded-xl px-2.5 py-2 text-sm bg-white ' +
    'focus:outline-none focus:ring-[3px] focus:ring-primary-500/20 focus:border-primary-500 ' +
    'transition-[border-color,box-shadow]';

  return (
    <div className="flex items-center gap-2 bg-gray-50/60 border border-gray-100 rounded-xl px-3 py-2.5">

      {/* Category */}
      <select
        value={row.categoryId}
        onChange={(e) => {
          const cat = categories.find((c) => c.id === e.target.value);
          const mode: ItemMode = cat?.trackQuantity ? 'detailed' : 'simple';
          onChange({ categoryId: e.target.value, mode });
        }}
        disabled={catLoading}
        className={`${inputBase} w-[140px] shrink-0 text-gray-700 disabled:opacity-50 bg-white`}
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
        className={`${inputBase} flex-1 min-w-0 placeholder:text-gray-300`}
        required
      />

      {/* Amount section */}
      {row.mode === 'simple' ? (
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-xs font-medium text-gray-400">Bs</span>
          <input
            type="number"
            min="0.01"
            step="0.01"
            placeholder="0.00"
            value={row.amount}
            onChange={(e) => onChange({ amount: e.target.value })}
            className={`${inputBase} w-28 text-right`}
            required
          />
        </div>
      ) : (
        <div className="flex items-center gap-1 shrink-0 text-sm">
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
          <span className="text-gray-300 text-xs font-medium">×</span>
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
          <span className="text-gray-300 text-xs">=</span>
          <div className="w-[88px] rounded-xl border border-gray-100 bg-white px-2.5 py-2 text-sm text-right font-semibold text-gray-700 tabular-nums">
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
            hover:text-red-500 hover:bg-red-50 transition-colors"
        >
          <Icon name="x" size={14} strokeWidth={2} />
        </button>
      ) : (
        <div className="w-7 shrink-0" />
      )}
    </div>
  );
}
