import { useExpenseCategories } from '../../hooks/useExpenses';
import { Input, Select } from '../ui/Input';

export interface ConceptDraft {
  categoryId: string;
  name: string;
  unit: string;
  defaultUnitPrice: string;
}

export const EMPTY_CONCEPT: ConceptDraft = { categoryId: '', name: '', unit: '', defaultUnitPrice: '' };

export function parseConceptPrice(value: string): number | null {
  const n = parseFloat(value);
  return Number.isFinite(n) && n > 0 ? n : null;
}

/**
 * Campos de un gasto de la lista. Idénticos en el alta desde el registro y en la
 * administración. Las categorías solo se eligen aquí: crearlas o editarlas es de la pestaña
 * Categorías.
 */
export function ExpenseConceptFields({
  value, onChange, autoFocusName = false,
}: {
  value: ConceptDraft;
  onChange: (draft: ConceptDraft) => void;
  autoFocusName?: boolean;
}) {
  const { categories } = useExpenseCategories();

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <Select label="Categoría" value={value.categoryId} onChange={(e) => onChange({ ...value, categoryId: e.target.value })}>
        <option value="">Elige una categoría</option>
        {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
      </Select>

      <Input
        label="Nombre del gasto"
        autoFocus={autoFocusName}
        value={value.name}
        onChange={(e) => onChange({ ...value, name: e.target.value })}
        placeholder="Ej.: carne"
        maxLength={150}
      />

      <Input
        label="Unidad (opcional)"
        hint="Con unidad, al registrar se pide cantidad y precio por unidad."
        value={value.unit}
        onChange={(e) => onChange({ ...value, unit: e.target.value })}
        placeholder="kg, litro, mes"
        maxLength={20}
      />

      <Input
        label="Precio habitual (opcional)"
        hint="Solo se precarga; el monto real se escribe al registrar."
        type="number" inputMode="decimal" min="0" step="0.01"
        leftAddon="Bs"
        value={value.defaultUnitPrice}
        onChange={(e) => onChange({ ...value, defaultUnitPrice: e.target.value })}
        placeholder="0.00"
      />
    </div>
  );
}
