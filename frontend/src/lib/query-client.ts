import { MutationCache, QueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export function createQueryClient(): QueryClient {
  const client: QueryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, refetchOnWindowFocus: false } },
    mutationCache: new MutationCache({
      onSuccess: () => {
        void client.invalidateQueries();
      },
      onError: (error) => {
        toast.error(error.message);
        void client.invalidateQueries();
      },
    }),
  });
  return client;
}
