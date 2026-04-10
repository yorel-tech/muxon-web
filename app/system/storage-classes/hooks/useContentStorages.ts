import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  listContentStorages,
  createContentStorage,
  updateContentStorage,
  deleteContentStorage,
} from '@/lib/api/content-storage';
import type { ContentStorageTypeApi } from '@/types/content-storage';
import { useToast } from '@/lib/toast';

export const CONTENT_STORAGES_QUERY_KEY = ['content-storages'] as const;

export function useContentStoragesList() {
  return useQuery({
    queryKey: CONTENT_STORAGES_QUERY_KEY,
    queryFn: async () => {
      const res = await listContentStorages(1, 200);
      return res.items ?? [];
    },
  });
}

export function useCreateContentStorage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: {
      name: string;
      type: ContentStorageTypeApi;
      config: Record<string, unknown>;
      isDefault?: boolean;
    }) => createContentStorage(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CONTENT_STORAGES_QUERY_KEY });
      toast.success('Content storage created');
    },
    onError: (err: Error) => {
      toast.error('Create failed', err.message);
    },
  });
}

export function useUpdateContentStorage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      id,
      body,
    }: {
      id: string;
      body: { name?: string; config?: Record<string, unknown>; isDefault?: boolean };
    }) => updateContentStorage(id, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CONTENT_STORAGES_QUERY_KEY });
      toast.success('Content storage updated');
    },
    onError: (err: Error) => {
      toast.error('Update failed', err.message);
    },
  });
}

export function useDeleteContentStorage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => deleteContentStorage(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CONTENT_STORAGES_QUERY_KEY });
      toast.success('Content storage deleted');
    },
    onError: (err: Error) => {
      toast.error('Delete failed', err.message);
    },
  });
}
