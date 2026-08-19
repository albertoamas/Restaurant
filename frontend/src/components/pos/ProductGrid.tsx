import { useState } from 'react';
import type { ProductDto } from '@pos/shared';
import { Icon } from '../ui/Icon';

interface Props {
  products: ProductDto[];
  onSelect: (product: ProductDto) => void;
  /** When false the image area is hidden and cards show only name + price (compact mode) */
  showImages?: boolean;
}

function ProductCard({
  product,
  onSelect,
  showImages,
}: {
  product: ProductDto;
  onSelect: (p: ProductDto) => void;
  showImages: boolean;
}) {
  const [flash, setFlash] = useState(false);

  const handleClick = () => {
    onSelect(product);
    setFlash(true);
    setTimeout(() => setFlash(false), 500);
  };

  return (
    <button
      data-testid="product-card"
      onClick={handleClick}
      className={[
        'relative flex flex-col overflow-hidden rounded-2xl border text-left group',
        'transition-all duration-200',
        'hover:-translate-y-1',
        'active:scale-[0.93] active:translate-y-0',
        flash
          ? 'border-primary-500/60 shadow-[0_4px_16px_oklch(0.60_0.22_42/0.30)]'
          : 'border-[var(--border-subtle)] shadow-card-md',
      ].join(' ')}
      style={{ background: 'var(--color-surface-card)' }}
    >
      {showImages ? (
        /* ── Image mode ─────────────────────────── */
        product.imageUrl ? (
          <div className="relative w-full h-28 overflow-hidden" style={{ background: 'var(--color-surface-card)' }}>
            <div className="absolute inset-0 transition-transform duration-300 group-hover:scale-105 [will-change:transform]">
              <img
                src={product.imageUrl}
                alt={product.name}
                className="w-full h-full object-cover"
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent px-2.5 pt-4 pb-1.5">
                <span className="font-heading font-black text-sm text-white drop-shadow">
                  Bs {product.price.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="w-full h-24 flex items-center justify-center bg-[var(--color-surface-2)] group-hover:bg-[var(--color-surface-3)] transition-all duration-300">
            <Icon name="photo" size={32} strokeWidth={1.5} className="text-gray-400 group-hover:text-gray-300 transition-colors" />
          </div>
        )
      ) : null}

      {/* Info */}
      {showImages ? (
        /* With image: small text below */
        <div className="p-2.5 flex flex-col gap-0.5">
          <span className="text-[13px] font-semibold text-gray-700 leading-tight line-clamp-2">
            {product.name}
          </span>
          {!product.imageUrl && (
            <span className="font-heading font-black text-[15px] text-primary-400">
              Bs {product.price.toFixed(2)}
            </span>
          )}
        </div>
      ) : (
        /* Compact: larger name + price, more readable at a glance */
        <div className="px-3 py-3 flex flex-col gap-1 flex-1 justify-between">
          <span className="text-[13px] font-semibold text-gray-800 leading-snug line-clamp-3">
            {product.name}
          </span>
          <span className="font-heading font-black text-base text-primary-500 mt-1">
            Bs {product.price.toFixed(2)}
          </span>
        </div>
      )}

      {/* Flash overlay */}
      {flash && (
        <div className="absolute inset-0 bg-primary-500/10 pointer-events-none rounded-2xl" />
      )}

      {/* +1 badge */}
      {flash && (
        <div className="absolute top-2 right-2 bg-primary-600 text-white text-xs font-black px-2 py-0.5 rounded-full animate-in pointer-events-none shadow-[0_2px_8px_oklch(0.60_0.22_42/0.50)]">
          +1
        </div>
      )}
    </button>
  );
}

export function ProductGrid({ products, onSelect, showImages = true }: Props) {
  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-48 text-gray-500 gap-2">
        <Icon name="photo" size={40} strokeWidth={1.5} className="opacity-20" />
        <p className="text-sm font-medium">No hay productos</p>
      </div>
    );
  }

  return (
    <div className={[
      'grid gap-2.5 pt-1 pb-1',
      // Compact mode can show more columns since cards are shorter
      showImages
        ? 'grid-cols-2 md:grid-cols-3 xl:grid-cols-4'
        : 'grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5',
    ].join(' ')}>
      {products.map((product) => (
        <ProductCard key={product.id} product={product} onSelect={onSelect} showImages={showImages} />
      ))}
    </div>
  );
}
