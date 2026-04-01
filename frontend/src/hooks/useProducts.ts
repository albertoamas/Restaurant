import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { productsApi } from '../api/products.api';
import type { ProductDto } from '@pos/shared';

export function useProducts(includeInactive = false) {
  const [products, setProducts] = useState<ProductDto[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    productsApi
      .getAll(undefined, includeInactive)
      .then(setProducts)
      .catch(() => toast.error('Error al cargar productos'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  return { products, loading, reload: load };
}
