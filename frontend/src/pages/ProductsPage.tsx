import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { useQuery } from '@tanstack/react-query';
import { isUnlimited } from '@pos/shared';
import type { ProductDto } from '@pos/shared';
import { productsApi } from '../api/products.api';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { ConfirmModal } from '../components/ui/ConfirmModal';
import { EmptyState } from '../components/ui/EmptyState';
import { Icon } from '../components/ui/Icon';
import { Input, Select } from '../components/ui/Input';
import { PageHeader } from '../components/ui/PageHeader';
import { PageShell } from '../components/ui/PageShell';
import { Skeleton } from '../components/ui/Skeleton';
import { Toggle } from '../components/ui/Toggle';
import { useProducts } from '../hooks/useProducts';
import { useCategories } from '../hooks/useCategories';
import { useDebouncedValue } from '../hooks/useDebouncedValue';
import { useSettingsStore } from '../store/settings.store';
import { queryKeys } from '../lib/query-keys';
import { buildCategoryTones } from '../utils/category-tone';
import { handleApiError } from '../utils/api-error';
import { ProductFormModal } from '../components/products/ProductFormModal';
import { ProductThumb } from '../components/products/ProductThumb';
import { ProductCategories } from '../components/products/ProductCategories';
import { SegmentedControl } from '../components/ui/SegmentedControl';

function chipClass(active: boolean) {
  return [
    'inline-flex items-center min-h-9 rounded-full border px-3.5 text-label font-semibold whitespace-nowrap transition-colors',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/60',
    active ? 'border-primary-600 bg-primary-600 text-white' : 'border-line bg-surface-card text-soft hover:text-main hover:border-line-strong',
  ].join(' ');
}

export function ProductsPage() {
  const {
    products, loading, reload: reloadProducts,
    total, page, totalPages, setPage,
    q, setQ, categoryId, setCategoryId,
  } = useProducts(true, 50);
  const { categories, loading: catsLoading, reload: reloadCategories } = useCategories();
  const [tab, setTab] = useState<'products' | 'categories'>('products');
  const [newCategory, setNewCategory] = useState(false);
  const maxProducts = useSettingsStore((s) => s.planLimits?.maxProducts);

  // El plan cuenta solo los productos activos.
  const { data: activeCount = 0 } = useQuery({
    queryKey: queryKeys.productsActiveCount,
    queryFn:  () => productsApi.getAll({ limit: 1 }).then((r) => r.total),
  });
  const limited = maxProducts !== undefined && !isUnlimited(maxProducts);
  const full = limited && activeCount >= (maxProducts as number);

  const [search, setSearch] = useState('');
  const debounced = useDebouncedValue(search.trim(), 350);
  useEffect(() => { setQ(debounced); }, [debounced]); // eslint-disable-line react-hooks/exhaustive-deps

  const [form, setForm]           = useState<{ open: boolean; product: ProductDto | null }>({ open: false, product: null });
  const [deactivating, setDeactivating] = useState<ProductDto | null>(null);
  const [deleting, setDeleting]   = useState<ProductDto | null>(null);
  const [busy, setBusy]           = useState(false);

  const tones = useMemo(() => buildCategoryTones(categories), [categories]);
  const categoryName = (id: string) => categories.find((c) => c.id === id)?.name ?? null;

  const refresh = () => { reloadProducts(); reloadCategories(); };

  const toggle = async (p: ProductDto) => {
    setBusy(true);
    try {
      await productsApi.toggle(p.id);
      toast.success(p.isActive ? `${p.name} ya no aparece en el punto de venta` : `${p.name} vuelve al punto de venta`);
      setDeactivating(null);
      refresh();
    } catch (err) {
      handleApiError(err, 'Error al cambiar el estado');
    } finally {
      setBusy(false);
    }
  };
  // Desactivar saca el producto del punto de venta: se confirma. Activar va directo.
  const requestToggle = (p: ProductDto) => (p.isActive ? setDeactivating(p) : void toggle(p));

  const handleDelete = async () => {
    if (!deleting) return;
    setBusy(true);
    try {
      await productsApi.delete(deleting.id);
      toast.success(`${deleting.name} eliminado`);
      setDeleting(null);
      setForm({ open: false, product: null });
      refresh();
    } catch (err) {
      handleApiError(err, 'Error al eliminar el producto');
    } finally {
      setBusy(false);
    }
  };

  const openProduct = (p: ProductDto) => setForm({ open: true, product: p });

  return (
    <PageShell>
      <PageHeader
        title="Productos"
        description={limited ? `${activeCount} de ${maxProducts} productos activos de tu plan.` : `${activeCount} productos activos.`}
        actions={
          <>
            <SegmentedControl
              label="Sección del catálogo"
              value={tab}
              onChange={setTab}
              options={[{ value: 'products', label: 'Productos' }, { value: 'categories', label: 'Categorías' }]}
            />
            {tab === 'products' ? (
              <Button onClick={() => setForm({ open: true, product: null })} disabled={full}>
                <Icon name="plus" size={18} />
                Nuevo producto
              </Button>
            ) : (
              <Button onClick={() => setNewCategory(true)}>
                <Icon name="plus" size={18} />
                Nueva categoría
              </Button>
            )}
          </>
        }
      >
        {tab === 'products' && full && (
          <p className="flex items-start gap-2 rounded-control border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-label text-amber-800 dark:text-amber-300">
            <Icon name="warning" size={16} className="mt-0.5 shrink-0" />
            Llegaste al máximo de {maxProducts} productos activos de tu plan. Desactiva los que ya no vendes para agregar otros.
          </p>
        )}
      </PageHeader>

      {tab === 'categories' ? (
        <ProductCategories categories={categories} loading={catsLoading} onChanged={refresh} createOpen={newCategory} onCreateClose={() => setNewCategory(false)} />
      ) : (<>
      <div className="mb-4 space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="flex-1">
            <Input
              aria-label="Buscar producto"
              placeholder="Buscar producto"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              leftAddon={<Icon name="search" size={18} />}
            />
          </div>
          {/* Celular y tablet: desplegable; en fila las categorías saltaban a varias líneas. */}
          <div className="lg:hidden sm:w-60">
            <Select aria-label="Categoría" value={categoryId ?? ''} onChange={(e) => setCategoryId(e.target.value || undefined)}>
              <option value="">Todas las categorías</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </Select>
          </div>
        </div>
        {categories.length > 0 && (
          <div role="group" aria-label="Filtrar por categoría" className="hidden lg:flex flex-wrap gap-2">
            <button type="button" aria-pressed={categoryId === undefined} className={chipClass(categoryId === undefined)} onClick={() => setCategoryId(undefined)}>Todas</button>
            {categories.map((c) => (
              <button key={c.id} type="button" aria-pressed={categoryId === c.id} className={chipClass(categoryId === c.id)} onClick={() => setCategoryId(categoryId === c.id ? undefined : c.id)}>
                {c.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {loading ? (
        <div className="space-y-3"><Skeleton variant="card" /><Skeleton variant="card" /></div>
      ) : products.length === 0 ? (
        <EmptyState
          icon="box"
          title={q || categoryId ? 'Ningún producto con este filtro' : 'Todavía no tienes productos'}
          description={q || categoryId ? 'Prueba con otra búsqueda o categoría.' : 'Crea el primero para venderlo en el punto de venta.'}
          action={!q && !categoryId && !full ? <Button onClick={() => setForm({ open: true, product: null })}>Crear el primero</Button> : undefined}
        />
      ) : (
        <section className="overflow-hidden rounded-card border border-line bg-surface-card shadow-raised">
          <ul className="divide-y divide-line">
            {products.map((p) => {
              const cat = categoryName(p.categoryId);
              return (
                <li key={p.id} className="group flex items-center gap-3 px-3 py-2.5 transition-colors hover:bg-surface-2 sm:px-4">
                  <button
                    type="button"
                    onClick={() => openProduct(p)}
                    aria-label={`Editar ${p.name}`}
                    className={`flex min-w-0 flex-1 cursor-pointer items-center gap-3 rounded-control text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/60 ${p.isActive ? '' : 'opacity-60'}`}
                  >
                    <ProductThumb product={p} tone={tones.get(p.categoryId)} />
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2">
                        <span className="min-w-0 truncate text-body font-semibold text-main">{p.name}</span>
                        {!p.isActive && <Badge>Inactivo</Badge>}
                      </span>
                      <span className={`block truncate text-caption ${cat ? 'text-muted' : 'text-amber-800 dark:text-amber-300'}`}>
                        {cat ?? 'Sin categoría: edítalo para asignarle una'}
                      </span>
                    </span>
                    <span className="shrink-0 text-body font-bold text-main tabular-nums">Bs {p.price.toFixed(2)}</span>
                  </button>
                  <Toggle
                    checked={p.isActive}
                    onChange={() => requestToggle(p)}
                    label={p.isActive ? `Desactivar ${p.name}` : `Activar ${p.name}`}
                  />
                </li>
              );
            })}
          </ul>
          <div className="flex flex-col items-center justify-between gap-3 border-t border-line px-4 py-3 sm:flex-row">
            <p className="text-label text-soft">
              {totalPages > 1 ? `Página ${page} de ${totalPages}. ` : ''}{total === 1 ? '1 producto' : `${total} productos`}
            </p>
            {totalPages > 1 && (
              <div className="flex gap-2">
                <Button variant="secondary" size="sm" onClick={() => setPage(page - 1)} disabled={page <= 1}>
                  <Icon name="chevron-left" size={16} />
                  Anterior
                </Button>
                <Button variant="secondary" size="sm" onClick={() => setPage(page + 1)} disabled={page >= totalPages}>
                  Siguiente
                  <Icon name="chevron-right" size={16} />
                </Button>
              </div>
            )}
          </div>
        </section>
      )}

      </>)}

      <ProductFormModal
        isOpen={form.open}
        onClose={() => setForm({ open: false, product: null })}
        onSaved={refresh}
        onDelete={setDeleting}
        product={form.product}
        categories={categories}
      />


      <ConfirmModal
        isOpen={deactivating !== null}
        onClose={() => setDeactivating(null)}
        onConfirm={() => { if (deactivating) void toggle(deactivating); }}
        loading={busy}
        title={deactivating ? `Desactivar ${deactivating.name}` : 'Desactivar producto'}
        message="Deja de aparecer en el punto de venta y no cuenta para el límite de tu plan. Puedes volver a activarlo cuando quieras."
        confirmLabel="Desactivar"
        cancelLabel="Volver"
      />

      <ConfirmModal
        isOpen={deleting !== null}
        onClose={() => setDeleting(null)}
        onConfirm={handleDelete}
        loading={busy}
        variant="danger"
        title={deleting ? `Eliminar ${deleting.name}` : 'Eliminar producto'}
        message="Desaparece del catálogo. Los pedidos ya hechos no cambian. Si solo quieres dejar de venderlo, mejor desactívalo."
        confirmLabel="Eliminar producto"
        cancelLabel="Volver"
      />
    </PageShell>
  );
}
