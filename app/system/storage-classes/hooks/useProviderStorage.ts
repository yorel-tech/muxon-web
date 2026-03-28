import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { storageApi } from "@/lib/api/storage";
import { useToast } from "@/lib/toast";

/**
 * When providerId is set, lists storage for that provider.
 * When null/undefined, lists global provider-storage inventory.
 */
export function useProviderStorage(providerId: string | null | undefined) {
  return useQuery({
    queryKey: ["provider-storage", providerId ?? "global"],
    queryFn: async () => {
      if (providerId) {
        return storageApi.listProviderStorageByProvider(providerId);
      }
      return storageApi.listProviderStorageGlobal();
    },
  });
}

export function useProviderStorageById(id: string | null | undefined) {
  return useQuery({
    queryKey: ["provider-storage-item", id],
    queryFn: () => storageApi.getProviderStorage(id!),
    enabled: !!id,
  });
}

export function useSyncProviderStorage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (providerId: string) => storageApi.syncProviderStorage(providerId),
    onSuccess: (data, providerId) => {
      queryClient.invalidateQueries({ queryKey: ["provider-storage"] });
      toast.success(
        "Sync started",
        data?.message ?? `Storage sync for provider ${providerId} (${data?.status ?? "accepted"})`,
      );
    },
    onError: (err: Error) => {
      toast.error("Sync failed", err.message);
    },
  });
}
