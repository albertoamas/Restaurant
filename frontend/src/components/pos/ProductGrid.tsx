import { useState } from 'react';
import type { ProductDto } from '@pos/shared';

interface Props {
  products: ProductDto[];
  onSelect: (product: ProductDto) => void;
}

function ProductCard({ product, onSelect }: { product: ProductDto; onSelect: (p: ProductDto) => void }) {
  const [flash, setFlash] = useState(false);

  const handleClick = () => {
    onSelect(product);
    setFlash(true);
    setTimeout(() => setFlash(false), 600);
  };

  return (
    <button
      onClick={handleClick}
      className={[
        'relative flex flex-col overflow-hidden rounded-xl border bg-white text-left',
        'transition-all duration-150',
        'hover:-translate-y-0.5',
        'hover:border-primary-300',
        'hover:shadow-[0_8px_24px_oklch(0.13_0.012_260/0.12)]',
        'active:scale-[0.94] active:shadow-none',
        flash ? 'border-primary-400' : 'border-gray-200',
        'shadow-[0_1px_3px_oklch(0.13_0.012_260/0.07)]',
      ].join(' ')}
    >
      {/* Image / placeholder */}
      {product.imageUrl ? (
        <img
          src={product.imageUrl}
          alt={product.name}
          className="w-full h-28 object-cover"
          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
        />
      ) : (
        <div className="w-full h-24 flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100">
          <svg className="w-8 h-8 text-primary-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
      )}

      {/* Info */}
      <div className="p-2.5 flex flex-col gap-0.5">
        <span className="text-[13px] font-semibold text-gray-700 leading-tight line-clamp-2">
          {product.name}
        </span>
        <span className="font-heading font-black text-[15px] text-gray-900">
          Bs {product.price.toFixed(2)}
        </span>
      </div>

      {/* Flash feedback badge */}
      {flash && (
        <div className="absolute top-2 right-2 bg-primary-600 text-white text-xs font-bold px-1.5 py-0.5 rounded-full animate-fade pointer-events-none">
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
        <svg className="w-10 h-10 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
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
