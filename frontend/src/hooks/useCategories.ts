import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { categoriesApi } from '../api/categories.api';
import type { CategoryDto } from '@pos/shared';

export function useCategories() {
  const [categories, setCategories] = useState<CategoryDto[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    categoriesApi
      .getAll()
      .then(setCategories)
      .catch(() => toast.error('Error al cargar categorías'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  return { categories, loading, reload: load };
}
