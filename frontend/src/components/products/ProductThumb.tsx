import { useState } from 'react';
import type { ProductDto } from '@pos/shared';
import { productInitial } from '../../utils/category-tone';

const NEUTRAL = 'bg-surface-2 text-soft';

/**
 * Foto del producto o, sin foto (o si no carga), su inicial con el color de su categoría:
 * igual que en el punto de venta, para reconocer el producto en las dos pantallas.
 */
export function ProductThumb({ product, tone, size = 48 }: { product: ProductDto; tone?: string; size?: number }) {
  const [broken, setBroken] = useState(false);
  const style = { width: size, height: size };
  if (product.imageUrl && !broken) {
    return <img src={product.imageUrl} alt="" style={style} className="shrink-0 rounded-control object-cover" onError={() => setBroken(true)} />;
  }
  return (
    <span aria-hidden style={style} className={`flex shrink-0 items-center justify-center rounded-control font-heading text-heading font-bold ${tone ?? NEUTRAL}`}>
      {productInitial(product.name)}
    </span>
  );
}
