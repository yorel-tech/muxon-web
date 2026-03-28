import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { storageApi } from "@/lib/api/storage";
import type { StorageClassCreate, StorageClassUpdate } from "../types";
import { useToast } from "@/lib/toast";

export function useStorageClasses() {
  return useQuery({
    queryKey: ["storage-classes"],
    queryFn: () => storageApi.listStorageClasses(),
  });
}

export function useCreateStorageClass() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: StorageClassCreate) => storageApi.createStorageClass(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["storage-classes"] });
      toast.success("Storage class created");
    },
    onError: (err: Error) => {
      toast.error("Create failed", err.message);
    },
  });
}

export function useUpdateStorageClass() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ name, data }: { name: string; data: StorageClassUpdate }) =>
      storageApi.replaceStorageClass(name, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["storage-classes"] });
      toast.success("Storage class updated");
    },
    onError: (err: Error) => {
      toast.error("Update failed", err.message);
    },
  });
}

export function useDeleteStorageClass() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (name: string) => storageApi.deleteStorageClass(name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["storage-classes"] });
      queryClient.invalidateQueries({ queryKey: ["storage-overrides-aggregated"] });
      toast.success("Storage class deleted");
    },
    onError: (err: Error) => {
      toast.error("Delete failed", err.message);
    },
  });
}
