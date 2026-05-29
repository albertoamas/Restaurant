import { useState } from 'react';
import type { ProductDto } from '@pos/shared';
import { Icon } from '../ui/Icon';

interface Props {
  products: ProductDto[];
  onSelect: (product: ProductDto) => void;
}

function ProductCard({ product, onSelect }: { product: ProductDto; onSelect: (p: ProductDto) => void }) {
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
          ? 'border-primary-400 shadow-[0_4px_14px_oklch(0.13_0.012_260/0.14)]'
          : 'border-gray-200 shadow-[0_2px_8px_oklch(0.13_0.012_260/0.08)]',
        'bg-white backdrop-blur-sm',
      ].join(' ')}
    >
      {/* Image / placeholder */}
      {product.imageUrl ? (
        <div className="relative w-full h-28 overflow-hidden">
          <img
            src={product.imageUrl}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
          {/* Price overlay en imagen */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/50 to-transparent px-2.5 pt-4 pb-1.5">
            <span className="font-heading font-black text-sm text-white drop-shadow">
              Bs {product.price.toFixed(2)}
            </span>
          </div>
        </div>
      ) : (
        <div className="w-full h-24 flex items-center justify-center bg-gradient-to-br from-primary-100 via-primary-50 to-white group-hover:from-primary-200 group-hover:to-primary-50 transition-all duration-300">
          <Icon name="photo" size={32} strokeWidth={1.5} className="text-primary-300 group-hover:text-primary-400 transition-colors" />
        </div>
      )}

      {/* Info */}
      <div className="p-2.5 flex flex-col gap-0.5">
        <span className="text-[13px] font-semibold text-gray-700 leading-tight line-clamp-2">
          {product.name}
        </span>
        {!product.imageUrl && (
          <span className="font-heading font-black text-[15px] text-primary-600">
            Bs {product.price.toFixed(2)}
          </span>
        )}
      </div>

      {/* Flash overlay */}
      {flash && (
        <div className="absolute inset-0 bg-primary-500/12 pointer-events-none rounded-2xl" />
      )}

      {/* +1 badge */}
      {flash && (
        <div className="absolute top-2 right-2 bg-primary-600 text-white text-xs font-black px-2 py-0.5 rounded-full animate-in pointer-events-none shadow-[0_2px_8px_oklch(0.49_0.21_234/0.45)]">
          +1
        </div>
      )}
    </button>
  );
}

export function ProductGrid({ products, onSelect }: Props) {
  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-48 text-gray-400 gap-2">
        <Icon name="photo" size={40} strokeWidth={1.5} className="opacity-30" />
        <p className="text-sm font-medium">No hay productos</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-2.5 pt-1 pb-1">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} onSelect={onSelect} />
      ))}
    </div>
  );
}
