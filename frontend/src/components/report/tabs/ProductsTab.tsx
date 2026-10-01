import type { CategoryDto, TopCategoryDto, TopProductDto } from '@pos/shared';
import { EmptyState } from '../../ui/EmptyState';
import { Select } from '../../ui/Input';
import { Skeleton } from '../../ui/Skeleton';
import { ChartCard, RankRow, bs, share } from '../index';
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

const units = (n: number) => `${n} ${n === 1 ? 'unidad' : 'unidades'}`;

/** Qué se vendió: ranking de productos y peso de cada categoría. */
export function ProductsTab({
  topProducts, topCategories, categories,
  selectedCategory, onCategoryChange, loading, categoriesLoading,
}: Props) {
  return (
    <div className="space-y-4">
      <ChartCard
        title="Productos más vendidos"
        description="Por unidades vendidas en el período."
        action={categories.length > 0 && (
          <div className="w-full sm:w-56">
            <Select aria-label="Filtrar por categoría" inputSize="sm" value={selectedCategory} onChange={(e) => onCategoryChange(e.target.value)}>
              <option value="">Todas las categorías</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </Select>
          </div>
        )}
      >
        {loading ? (
          <Skeleton variant="rect" h="240px" />
        ) : topProducts.length === 0 ? (
          <EmptyState compact icon="package" title="Sin ventas de productos en este período" />
        ) : (
          <ExpandableList
            items={topProducts}
            renderItem={(p, i) => (
              <RankRow
                key={p.productId}
                rank={i + 1}
                title={p.productName}
                detail={p.categoryName ?? undefined}
                value={units(p.totalQuantity)}
                secondary={bs(p.totalRevenue)}
                pct={share(p.totalQuantity, topProducts[0].totalQuantity)}
              />
            )}
          />
        )}
      </ChartCard>

      <ChartCard title="Categorías más vendidas" description="Por unidades vendidas o por ingresos.">
        {categoriesLoading ? (
          <Skeleton variant="rect" h="200px" />
        ) : topCategories.length > 0 ? (
          <CategoryBarChart data={topCategories} />
        ) : (
          <EmptyState compact icon="package" title="Sin ventas por categoría en este período" />
        )}
      </ChartCard>
    </div>
  );
}
