import { useId, useState } from 'react';
import toast from 'react-hot-toast';
import { useQuery } from '@tanstack/react-query';
import type { CategoryDto } from '@pos/shared';
import { categoriesApi } from '../../api/categories.api';
import { productsApi } from '../../api/products.api';
import { ActionMenu } from '../ui/ActionMenu';
import { Button } from '../ui/Button';
import { ConfirmModal } from '../ui/ConfirmModal';
import { EmptyState } from '../ui/EmptyState';
import { Icon } from '../ui/Icon';
import { Input } from '../ui/Input';
import { Modal } from '../ui/Modal';
import { Skeleton } from '../ui/Skeleton';
import { handleApiError } from '../../utils/api-error';
import { queryKeys } from '../../lib/query-keys';

/** Crear (`category` null) o renombrar una categoría. Se monta al abrir. */
function CategoryNameModal({ category, nextOrder, onClose, onSaved }: {
  category: CategoryDto | null;
  nextOrder: number;
  onClose: () => void;
  onSaved: () => void;
}) {
  const formId = useId();
  const [name, setName] = useState(category?.name ?? '');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const value = name.trim();
    if (!value) return;
    setSaving(true);
    try {
      if (category) await categoriesApi.update(category.id, { name: value });
      // Una categoría nueva va al final del punto de venta; después se mueve con subir y bajar.
      else          await categoriesApi.create({ name: value, sortOrder: nextOrder });
      toast.success(category ? 'Categoría renombrada' : `Categoría ${value} creada`);
      onSaved();
      onClose();
    } catch (err) {
      handleApiError(err, category ? 'No se pudo renombrar la categoría' : 'No se pudo crear la categoría');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={category ? `Renombrar ${category.name}` : 'Nueva categoría'}
      size="sm"
      footer={
        <div className="flex gap-3">
          <Button type="button" variant="secondary" fullWidth onClick={onClose} disabled={saving}>Cancelar</Button>
          <Button type="submit" form={formId} fullWidth loading={saving} disabled={!name.trim()}>
            {category ? 'Guardar' : 'Crear categoría'}
          </Button>
        </div>
      }
    >
      <form id={formId} onSubmit={handleSubmit}>
        <Input
          label="Nombre de la categoría"
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ej.: bebidas"
          hint={category ? undefined : 'Se agrega al final; puedes moverla después.'}
        />
      </form>
    </Modal>
  );
}

/**
 * Categorías del catálogo en el orden en que aparecen en el punto de venta. El orden se cambia
 * con subir y bajar (antes había que escribir un número de posición en cada una).
 */
export function ProductCategories({ categories, loading, onChanged, createOpen, onCreateClose }: {
  categories: CategoryDto[];
  loading: boolean;
  onChanged: () => void;
  /** "Nueva categoría" vive en el encabezado de la página, a la derecha como "Nuevo producto". */
  createOpen: boolean;
  onCreateClose: () => void;
}) {
  const ordered = [...categories].sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name, 'es'));
  const [form, setForm]         = useState<{ open: boolean; category: CategoryDto | null }>({ open: false, category: null });
  const [removing, setRemoving] = useState<CategoryDto | null>(null);
  const [busy, setBusy]         = useState<string | null>(null);

  // Cuántos productos tiene cada una (activos e inactivos): una consulta por categoría.
  const { data: counts } = useQuery({
    queryKey: queryKeys.productsCountByCategory(ordered.map((c) => c.id)),
    queryFn:  async () => {
      const totals = await Promise.all(ordered.map((c) =>
        productsApi.getAll({ categoryId: c.id, includeInactive: true, limit: 1 }).then((r) => [c.id, r.total] as const)));
      return new Map(totals);
    },
    enabled: ordered.length > 0,
  });

  /** Mueve una categoría un lugar y renumera 1..n; solo se guardan las que cambiaron. */
  const move = async (index: number, delta: -1 | 1) => {
    const target = index + delta;
    if (target < 0 || target >= ordered.length) return;
    const next = [...ordered];
    [next[index], next[target]] = [next[target], next[index]];
    setBusy(ordered[index].id);
    try {
      await Promise.all(next.map((c, i) => (c.sortOrder === i + 1 ? null : categoriesApi.update(c.id, { sortOrder: i + 1 }))));
      onChanged();
    } catch (err) {
      handleApiError(err, 'No se pudo cambiar el orden');
    } finally {
      setBusy(null);
    }
  };

  const handleRemove = async () => {
    if (!removing) return;
    setBusy('remove');
    try {
      await categoriesApi.delete(removing.id);
      toast.success(`Categoría ${removing.name} eliminada`);
      setRemoving(null);
      onChanged();
    } catch (err) {
      handleApiError(err, 'No se pudo eliminar la categoría');
    } finally {
      setBusy(null);
    }
  };

  const removingCount = removing ? counts?.get(removing.id) ?? 0 : 0;
  const nextOrder = (ordered[ordered.length - 1]?.sortOrder ?? 0) + 1;

  return (
    <div className="space-y-4">
      <p className="text-label text-soft">El orden de esta lista es el orden de las categorías en el punto de venta.</p>

      {loading ? (
        <Skeleton variant="card" />
      ) : ordered.length === 0 ? (
        <EmptyState icon="box" title="Todavía no tienes categorías" description="Crea una para agrupar tus productos en el punto de venta." />
      ) : (
        <ol className="overflow-hidden rounded-card border border-line bg-surface-card shadow-raised divide-y divide-line">
          {ordered.map((c, i) => {
            const n = counts?.get(c.id);
            return (
              <li key={c.id} className="flex items-center gap-3 px-3 py-2 sm:px-4">
                <span className="w-6 shrink-0 text-center text-label font-semibold text-muted tabular-nums">{i + 1}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-body font-semibold text-main">{c.name}</p>
                  {n !== undefined && <p className="text-caption text-muted">{n === 1 ? '1 producto' : `${n} productos`}</p>}
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <Button variant="ghost" size="sm" className="disabled:bg-transparent disabled:border-transparent disabled:opacity-40" onClick={() => move(i, -1)} disabled={i === 0 || busy !== null} aria-label={`Subir ${c.name}`} title="Subir">
                    <Icon name="chevron-up" size={18} />
                  </Button>
                  <Button variant="ghost" size="sm" className="disabled:bg-transparent disabled:border-transparent disabled:opacity-40" onClick={() => move(i, 1)} disabled={i === ordered.length - 1 || busy !== null} aria-label={`Bajar ${c.name}`} title="Bajar">
                    <Icon name="chevron-down" size={18} />
                  </Button>
                  <ActionMenu
                    label={`Más acciones de ${c.name}`}
                    items={[
                      { label: 'Renombrar', icon: 'edit', onSelect: () => setForm({ open: true, category: c }) },
                      { label: 'Eliminar categoría', icon: 'trash', danger: true, onSelect: () => setRemoving(c) },
                    ]}
                  />
                </div>
              </li>
            );
          })}
        </ol>
      )}

      {(form.open || createOpen) && (
        <CategoryNameModal
          key={createOpen ? 'nueva' : form.category?.id}
          category={createOpen ? null : form.category}
          nextOrder={nextOrder}
          onClose={() => { setForm({ open: false, category: null }); onCreateClose(); }}
          onSaved={onChanged}
        />
      )}

      <ConfirmModal
        isOpen={removing !== null}
        onClose={() => setRemoving(null)}
        onConfirm={handleRemove}
        loading={busy === 'remove'}
        variant="danger"
        title={removing ? `Eliminar la categoría ${removing.name}` : 'Eliminar categoría'}
        message={removingCount > 0
          ? `Sus ${removingCount} productos quedan sin categoría hasta que les asignes otra. Los pedidos ya hechos no cambian.`
          : 'La categoría deja de aparecer. Los pedidos ya hechos no cambian.'}
        confirmLabel="Eliminar categoría"
        cancelLabel="Volver"
      />
    </div>
  );
}
