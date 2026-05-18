import { useQuery } from '@tanstack/react-query';
import { usersApi, type UserDto } from '../api/users.api';
import { queryKeys } from '../lib/query-keys';

export function useUsers() {
  const { data: users = [] as UserDto[], isPending: loading, refetch } = useQuery({
    queryKey: queryKeys.users,
    queryFn:  () => usersApi.getAll(),
  });
  return { users, loading, reload: refetch };
}
