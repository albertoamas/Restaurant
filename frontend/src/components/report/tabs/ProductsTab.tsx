import type { CategoryDto, TopCategoryDto, TopProductDto } from '@pos/shared';
import { Card } from '../../ui/Card';
import { Spinner } from '../../ui/Spinner';
import { Icon } from '../../ui/Icon';
import { TopProductRow } from '../index';
import { CategoryBarChart } from '../charts/CategoryBarChart';
import { ExpandableList } from '../ExpandableList';

interface Props {
  topProducts: TopProductDto[];
  topCategories: TopCategoryDto[];
  categories: CategoryDto[];
  selectedCategory: string;
  onCategoryChange: (id: string) => void;
  loading: boolean;
  categoriesLoading: boolean;
}

/** Qué se vendió: ranking de productos y peso de cada categoría. */
export function ProductsTab({
  topProducts, topCategories, categories,
  selectedCategory, onCategoryChange, loading, categoriesLoading,
}: Props) {
  return (
    <div className="space-y-4">
      <Card variant="default">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h3 className="font-heading text-sm font-bold text-gray-700">Productos Más Vendidos</h3>
          {categories.length > 0 && (
            <select
              data-print-hide
              value={selectedCategory}
              onChange={(e) => onCategoryChange(e.target.value)}
              className="cursor-pointer rounded-xl border border-[var(--border-subtle)] bg-[var(--color-surface-card)] px-3 py-1.5 text-xs text-gray-600 transition-[border-color,box-shadow] focus:border-primary-500/50 focus:outline-none focus:ring-[3px] focus:ring-primary-500/20"
            >
              <option value="">Todas las categorías</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center py-8"><Spinner /></div>
        ) : topProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-gray-400">
            <Icon name="package" size={32} strokeWidth={1.5} className="mb-2 opacity-40" />
            <p className="text-xs font-medium text-gray-500">Sin datos para este período</p>
          </div>
        ) : (
          <ExpandableList
            items={topProducts}
            renderItem={(p, i) => (
              <TopProductRow key={p.productId} rank={i + 1} product={p} maxQty={topProducts[0].totalQuantity} />
            )}
          />
        )}
      </Card>

      <Card variant="panel">
        <h3 className="mb-0.5 font-heading text-sm font-bold text-gray-700">Categorías Más Vendidas</h3>
        <p className="mb-4 text-[11px] text-gray-400">Toggle entre unidades e ingresos</p>
        {categoriesLoading ? (
          <div className="flex justify-center py-8"><Spinner /></div>
        ) : topCategories.length > 0 ? (
          <CategoryBarChart data={topCategories} />
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-gray-400">
            <Icon name="package" size={28} strokeWidth={1.5} className="mb-2 opacity-40" />
            <p className="text-xs">Sin datos para este período</p>
          </div>
        )}
      </Card>
    </div>
  );
}
