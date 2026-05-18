import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime:            30_000, // 30 s before background refetch
      refetchOnWindowFocus: true,   // replaces useVisibilityRefresh
      retry:                1,
    },
  },
});
