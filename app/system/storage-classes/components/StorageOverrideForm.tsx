"use client";

import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/atoms/button";
import { Input } from "@/components/ui/atoms/input";
import { Label } from "@/components/ui/atoms/label";
import { Select } from "@/components/ui/atoms/select";
import { Modal } from "@/components/ui/molecules/modal";
import { useStorageClasses } from "../hooks/useStorageClasses";
import { useProviderStorage } from "../hooks/useProviderStorage";
import { storageApi } from "@/lib/api/storage";
import { useReplaceStorageClassOverrides } from "../hooks/useStorageOverrides";
import { Badge } from "@/components/ui/atoms/badge";
import { X } from "lucide-react";
import type { StorageClassOverride, StorageOverrideRow } from "@/lib/types/storage";
import { useToast } from "@/lib/toast";

interface StorageOverrideFormProps {
  editRow?: StorageOverrideRow | null;
  defaultStorageClassName?: string;
  onClose: () => void;
}

export default function StorageOverrideForm({
  editRow = null,
  defaultStorageClassName = "",
  onClose,
}: StorageOverrideFormProps) {
  const [storageClassName, setStorageClassName] = useState("");
  const [providerType, setProviderType] = useState("libvirt");
  const [providerStorageNames, setProviderStorageNames] = useState<string[]>([]);
  const [priority, setPriority] = useState(100);
  const [datacenterId, setDatacenterId] = useState("");
  const [addPickerKey, setAddPickerKey] = useState(0);

  const { data: storageClasses = [] } = useStorageClasses();
  const { data: allProviderStorage = [] } = useProviderStorage(null);
  const replaceMutation = useReplaceStorageClassOverrides();
  const { toast } = useToast();

  useEffect(() => {
    if (editRow) {
      setStorageClassName(editRow.storageClassName);
      setProviderType(editRow.override.providerType);
      setProviderStorageNames([...editRow.override.providerStorageNames]);
      setPriority(editRow.override.priority ?? 100);
      setDatacenterId(editRow.override.datacenterId ?? "");
    } else {
      setStorageClassName(defaultStorageClassName || "");
      setProviderType("libvirt");
      setProviderStorageNames([]);
      setPriority(100);
      setDatacenterId("");
    }
  }, [editRow, defaultStorageClassName]);

  const availableStorage = useMemo(
    () => allProviderStorage.filter((s) => s.providerType === providerType),
    [allProviderStorage, providerType],
  );

  const addStorageOptions = useMemo(
    () =>
      availableStorage.map((storage) => ({
        value: storage.name ?? storage.externalId ?? storage.id,
        label: `${storage.name ?? storage.externalId ?? storage.id} (${storage.storageType})`,
      })),
    [availableStorage],
  );

  const handleAddStorage = (raw: string) => {
    if (!raw) return;
    if (!providerStorageNames.includes(raw)) {
      setProviderStorageNames([...providerStorageNames, raw]);
    }
    setAddPickerKey((k) => k + 1);
  };

  const handleRemoveStorage = (storageName: string) => {
    setProviderStorageNames(providerStorageNames.filter((n) => n !== storageName));
  };

  const buildOverridePayload = (): StorageClassOverride => {
    const o: StorageClassOverride = {
      providerType,
      providerStorageNames,
      priority,
    };
    const dc = datacenterId.trim();
    if (dc) o.datacenterId = dc;
    else o.datacenterId = null;
    return o;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!storageClassName) {
      toast.error("Validation", "Select a storage class");
      return;
    }
    if (providerStorageNames.length === 0) {
      toast.error("Validation", "Add at least one provider storage target");
      return;
    }

    try {
      const current = await storageApi.getStorageClassOverrides(storageClassName).catch(() => ({
        storageClassName,
        overrides: [] as StorageClassOverride[],
      }));
      const overrides = [...(current.overrides ?? [])];
      const payload = buildOverridePayload();

      if (editRow) {
        overrides[editRow.index] = payload;
      } else {
        overrides.push(payload);
      }

      await replaceMutation.mutateAsync({
        storageClassName,
        body: { storageClassName, overrides },
      });
      onClose();
    } catch (error) {
      console.error("Failed to save storage overrides:", error);
    }
  };

  const classOptions = storageClasses.map((sc) => ({ value: sc.name, label: sc.name }));

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={editRow ? "Edit override rule" : "Create override rule"}
      size="xl"
      showClose
    >
      <p className="text-sm text-gray-600 mb-4">
        Maps a storage class to preferred provider storage names (
        <code className="text-xs">PUT /api/v1/storage-classes/&#123;name&#125;/storage-overrides</code>).
      </p>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          <div>
            <Label htmlFor="sc">Storage class</Label>
            <Select
              id="sc"
              placeholder={storageClasses.length ? "Select storage class" : "No classes yet"}
              options={classOptions}
              value={storageClassName}
              onChange={(v) => setStorageClassName(v)}
              disabled={!!editRow || classOptions.length === 0}
              fullWidth
            />
          </div>

          <div>
            <Label htmlFor="pt">Provider type</Label>
            <Select
              id="pt"
              placeholder=""
              options={[
                { value: "libvirt", label: "Libvirt" },
                { value: "proxmox", label: "Proxmox" },
              ]}
              value={providerType}
              onChange={(v) => {
                setProviderType(v);
                setProviderStorageNames([]);
              }}
              fullWidth
            />
          </div>

          <div>
            <Label htmlFor="datacenterId">Datacenter ID (optional)</Label>
            <Input
              id="datacenterId"
              value={datacenterId}
              onChange={(e) => setDatacenterId(e.target.value)}
              placeholder="UUID for scoped overrides"
              fullWidth
            />
          </div>

          <div>
            <span className="block text-sm font-medium text-gray-700 mb-1">Provider storage names</span>
            {addStorageOptions.length === 0 ? (
              <p className="text-sm text-gray-500 border rounded-md px-3 py-2 border-gray-200">
                No inventory for this provider type. Sync storage from provider details or the Provider
                storage tab.
              </p>
            ) : (
              <Select
                key={addPickerKey}
                id="add-storage"
                placeholder="Add from inventory…"
                options={addStorageOptions}
                onChange={(v) => handleAddStorage(v)}
                fullWidth
              />
            )}

            <div className="flex gap-2 flex-wrap min-h-[40px] border border-gray-200 rounded-md p-2 mt-2">
              {providerStorageNames.length === 0 ? (
                <span className="text-sm text-gray-500">No storage selected</span>
              ) : (
                providerStorageNames.map((name) => (
                  <Badge key={name} variant="secondary" className="gap-1 flex items-center">
                    {name}
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() => handleRemoveStorage(name)}
                    />
                  </Badge>
                ))
              )}
            </div>
          </div>

          <div>
            <Label htmlFor="priority">Priority</Label>
            <Input
              id="priority"
              type="number"
              value={priority}
              onChange={(e) => setPriority(parseInt(e.target.value, 10) || 0)}
              fullWidth
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-gray-200">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={replaceMutation.isPending}>
            {replaceMutation.isPending ? "Saving…" : "Save"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
