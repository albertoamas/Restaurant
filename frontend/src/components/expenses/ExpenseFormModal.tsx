import { useState } from 'react';
import toast from 'react-hot-toast';
import { ExpenseCategory } from '@pos/shared';
import { expensesApi } from '../../api/expenses.api';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { handleApiError } from '../../utils/api-error';
import { useAuth } from '../../context/auth.context';

interface ExpenseFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
}

const CATEGORIES: { value: ExpenseCategory; label: string; icon: string }[] = [
  { value: ExpenseCategory.SUPPLIES,    label: 'Insumos',        icon: '🧂' },
  { value: ExpenseCategory.WAGES,       label: 'Personal',       icon: '👤' },
  { value: ExpenseCategory.UTILITIES,   label: 'Servicios',      icon: '💡' },
  { value: ExpenseCategory.TRANSPORT,   label: 'Transporte',     icon: '🚗' },
  { value: ExpenseCategory.MAINTENANCE, label: 'Mantenimiento',  icon: '🔧' },
  { value: ExpenseCategory.OTHER,       label: 'Otro',           icon: '📋' },
];

export function ExpenseFormModal({ isOpen, onClose, onSaved }: ExpenseFormModalProps) {
  const { currentBranchId } = useAuth();
  const [category, setCategory] = useState<ExpenseCategory>(ExpenseCategory.SUPPLIES);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const reset = () => {
    setCategory(ExpenseCategory.SUPPLIES);
    setAmount('');
    setDescription('');
  };

  const handleClose = () => { reset(); onClose(); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseFloat(amount);
    if (!parsed || parsed <= 0) {
      toast.error('Ingresa un monto válido');
      return;
    }
    setLoading(true);
    try {
      await expensesApi.create({
        category,
        amount: parsed,
        description: description.trim() || undefined,
        branchId: currentBranchId ?? undefined,
      });
      toast.success('Gasto registrado');
      reset();
      onSaved();
      onClose();
    } catch (err) {
      handleApiError(err, 'Error al registrar gasto');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Registrar Gasto" size="sm">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Category selector */}
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-2">Categoría</label>
          <div className="grid grid-cols-3 gap-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.value}
                type="button"
                onClick={() => setCategory(cat.value)}
                className={`flex flex-col items-center gap-1 p-2.5 rounded-xl border text-xs font-semibold transition-all duration-150 ${
                  category === cat.value
                    ? 'bg-primary-50 border-primary-400 text-primary-700 shadow-[0_0_0_2px_oklch(0.50_0.24_225/0.15)]'
                    : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300'
                }`}
              >
                <span className="text-lg leading-none">{cat.icon}</span>
                <span>{cat.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Amount */}
        <Input
          label="Monto"
          type="number"
          min="0.01"
          step="0.01"
          placeholder="0.00"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          leftAddon={<span className="text-gray-400 text-sm font-semibold">Bs</span>}
          required
        />

        {/* Description */}
        <Input
          label="Descripción (opcional)"
          placeholder="Ej: Compra de harina y huevos"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          hint="Detalle adicional del gasto"
        />

        <div className="flex gap-3 pt-1">
          <Button type="button" variant="secondary" fullWidth onClick={handleClose}>
            Cancelar
          </Button>
          <Button type="submit" fullWidth loading={loading}>
            Guardar Gasto
          </Button>
        </div>
      </form>
    </Modal>
  );
}
