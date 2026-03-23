import type { ProductDto } from '@pos/shared';

interface Props {
  products: ProductDto[];
  onSelect: (product: ProductDto) => void;
}

const colors = [
  'bg-sky-50 hover:bg-sky-100 border-sky-200',
  'bg-amber-50 hover:bg-amber-100 border-amber-200',
  'bg-emerald-50 hover:bg-emerald-100 border-emerald-200',
  'bg-violet-50 hover:bg-violet-100 border-violet-200',
  'bg-rose-50 hover:bg-rose-100 border-rose-200',
  'bg-cyan-50 hover:bg-cyan-100 border-cyan-200',
];

function getColor(index: number) {
  return colors[index % colors.length];
}

export function ProductGrid({ products, onSelect }: Props) {
  if (products.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-gray-400">
        No hay productos disponibles
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
      {products.map((product, i) => (
        <button
          key={product.id}
          onClick={() => onSelect(product)}
          className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all
            active:scale-95 min-h-[90px] ${getColor(i)}`}
        >
          <span className="font-semibold text-gray-800 text-sm text-center leading-tight">
            {product.name}
          </span>
          <span className="text-gray-600 font-bold mt-1">
            S/ {product.price.toFixed(2)}
          </span>
        </button>
      ))}
    </div>
  );
}
