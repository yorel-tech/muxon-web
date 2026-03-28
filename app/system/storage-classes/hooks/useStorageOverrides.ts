import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { storageApi } from "@/lib/api/storage";
import type { StorageClassOverrides, StorageClassOverride, StorageOverrideRow } from "../types";
import { useToast } from "@/lib/toast";

function flattenOverrides(
  classes: { name: string }[],
  results: StorageClassOverrides[],
): StorageOverrideRow[] {
  const rows: StorageOverrideRow[] = [];
  results.forEach((doc, i) => {
    const className = classes[i]?.name ?? doc.storageClassName;
    (doc.overrides ?? []).forEach((override, index) => {
      rows.push({ storageClassName: className, index, override });
    });
  });
  return rows;
}

/** Aggregates per-class override documents into flat rows for the UI */
export function useStorageOverridesAggregated() {
  return useQuery({
    queryKey: ["storage-overrides-aggregated"],
    queryFn: async () => {
      const classes = await storageApi.listStorageClasses();
      const results = await Promise.all(
        classes.map((c) =>
          storageApi.getStorageClassOverrides(c.name).catch(() => ({
            storageClassName: c.name,
            overrides: [] as StorageClassOverride[],
          })),
        ),
      );
      return flattenOverrides(classes, results);
    },
  });
}

export function useRemoveStorageOverrideRow() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (row: StorageOverrideRow) => {
      const current = await storageApi.getStorageClassOverrides(row.storageClassName);
      const overrides = (current.overrides ?? []).filter((_, i) => i !== row.index);
      await storageApi.replaceStorageClassOverrides(row.storageClassName, {
        storageClassName: row.storageClassName,
        overrides,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["storage-overrides-aggregated"] });
      toast.success("Override removed");
    },
    onError: (err: Error) => {
      toast.error("Remove failed", err.message);
    },
  });
}

export function useReplaceStorageClassOverrides() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ storageClassName, body }: { storageClassName: string; body: StorageClassOverrides }) =>
      storageApi.replaceStorageClassOverrides(storageClassName, {
        ...body,
        storageClassName,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["storage-overrides-aggregated"] });
      toast.success("Overrides saved");
    },
    onError: (err: Error) => {
      toast.error("Overrides save failed", err.message);
    },
  });
}
