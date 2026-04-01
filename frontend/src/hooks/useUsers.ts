import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { usersApi, type UserDto } from '../api/users.api';

export function useUsers() {
  const [users, setUsers] = useState<UserDto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    usersApi
      .getAll()
      .then((data) => setUsers(Array.isArray(data) ? data : []))
      .catch(() => toast.error('Error al cargar usuarios'))
      .finally(() => setLoading(false));
  }, []);

  return { users, setUsers, loading };
}
