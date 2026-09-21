import { useExpenseCategories } from '../../hooks/useExpenses';
import { FIELD, Field } from './ExpenseField';

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
 * Campos de un gasto de la lista. Idénticos en el alta desde el panel y en el
 * configurador. Las categorías solo se eligen acá — crearlas o editarlas es
 * cosa de la pestaña Categorías.
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
      <Field label="Categoría">
        <select
          value={value.categoryId}
          onChange={(e) => onChange({ ...value, categoryId: e.target.value })}
          className={FIELD}
        >
          <option value="">Elegir categoría…</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </Field>

      <Field label="Nombre del gasto">
        <input
          autoFocus={autoFocusName}
          value={value.name}
          onChange={(e) => onChange({ ...value, name: e.target.value })}
          placeholder="Ej: Carne"
          maxLength={150}
          className={FIELD}
        />
      </Field>

      <Field label="Unidad" optional hint="Con unidad se pide cantidad × precio al registrar.">
        <input
          value={value.unit}
          onChange={(e) => onChange({ ...value, unit: e.target.value })}
          placeholder="kg, litro, mes…"
          maxLength={20}
          className={FIELD}
        />
      </Field>

      <Field label="Precio habitual" optional hint="Solo se precarga; el monto real lo pones al registrar.">
        <input
          type="number" inputMode="decimal" min="0" step="0.01"
          value={value.defaultUnitPrice}
          onChange={(e) => onChange({ ...value, defaultUnitPrice: e.target.value })}
          placeholder="0.00"
          className={FIELD}
        />
      </Field>
    </div>
  );
}
