import { useMemo } from 'react';
import type { CategoryDto, ProductDto } from '@pos/shared';
import { EmptyState } from '../ui/EmptyState';
import { buildCategoryTones, productInitial } from '../../utils/category-tone';

interface Props {
  products: ProductDto[];
  onSelect: (product: ProductDto) => void;
  /** false: tarjetas compactas, sin foto ni inicial (ajuste "mostrar imágenes"). */
  showImages?: boolean;
  /** Para el color de la inicial en productos sin foto. Sin ella, la inicial va en gris. */
  categories?: CategoryDto[];
  /** Unidades ya cargadas en el pedido, por productId: se muestran en la tarjeta. */
  quantities?: Record<string, number>;
}

const NEUTRAL_TONE = 'bg-surface-2 text-soft';

function ProductCard({
  product, onSelect, showImages, tone, quantity,
}: {
  product: ProductDto;
  onSelect: (p: ProductDto) => void;
  showImages: boolean;
  tone: string;
  quantity: number;
}) {
  const inOrder = quantity > 0;

  return (
    <button
      data-testid="product-card"
      onClick={() => onSelect(product)}
      className={[
        'relative flex flex-col overflow-hidden rounded-card border bg-surface-card text-left',
        'transition-[border-color,box-shadow,transform] duration-150 active:scale-[0.98]',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/60',
        inOrder ? 'border-primary-500/70 shadow-floating' : 'border-line shadow-raised hover:border-line-strong',
      ].join(' ')}
    >
      {showImages && (
        product.imageUrl ? (
          <div className="h-24 sm:h-28 w-full overflow-hidden bg-surface-2">
            <img
              src={product.imageUrl}
              alt=""
              loading="lazy"
              className="w-full h-full object-cover"
              onError={(e) => { (e.target as HTMLImageElement).style.visibility = 'hidden'; }}
            />
          </div>
        ) : (
          <div className={`h-24 sm:h-28 w-full flex items-center justify-center ${tone}`} aria-hidden="true">
            <span className="text-display font-bold font-heading">{productInitial(product.name)}</span>
          </div>
        )
      )}

      <div className="flex flex-1 flex-col justify-between gap-1 p-3">
        <span className="text-body font-semibold text-main leading-snug line-clamp-2">{product.name}</span>
        <span className="text-body font-bold text-primary-700 dark:text-primary-400">
          Bs {product.price.toFixed(2)}
        </span>
      </div>

      {inOrder && (
        <>
          <span
            key={quantity}
            aria-hidden="true"
            className="absolute top-2 right-2 min-w-7 h-7 px-1.5 rounded-full bg-primary-600 text-white text-label font-bold flex items-center justify-center shadow-raised animate-in"
          >
            {quantity}
          </span>
          <span className="sr-only">, {quantity} en el pedido</span>
        </>
      )}
    </button>
  );
}

export function ProductGrid({ products, onSelect, showImages = true, categories = [], quantities = {} }: Props) {
  const tones = useMemo(() => buildCategoryTones(categories), [categories]);

  if (products.length === 0) {
    return (
      <EmptyState
        icon="search"
        title="Sin productos"
        description="Prueba con otra categoría o con otra búsqueda."
      />
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3">
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          onSelect={onSelect}
          showImages={showImages}
          tone={tones.get(product.categoryId) ?? NEUTRAL_TONE}
          quantity={quantities[product.id] ?? 0}
        />
      ))}
    </div>
  );
}
