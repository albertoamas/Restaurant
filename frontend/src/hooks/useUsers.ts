import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { usersApi, type UserDto } from '../api/users.api';
import { useVisibilityRefresh } from './useVisibilityRefresh';

export function useUsers() {
  const [users, setUsers] = useState<UserDto[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    usersApi
      .getAll()
      .then((data) => setUsers(Array.isArray(data) ? data : []))
      .catch(() => toast.error('Error al cargar usuarios'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  // Refresh when returning to the tab
  useVisibilityRefresh(load);

  return { users, setUsers, loading };
}
