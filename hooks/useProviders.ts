import { useQuery } from '@tanstack/react-query';
import { fetchProvidersWithLinks } from '@/lib/api';
import type { Provider } from '@/types/provider';

export function useProviders() {
  return useQuery({
    queryKey: ['providers'],
    queryFn: () => fetchProvidersWithLinks() as Promise<Provider[]>,
  });
}
