"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/atoms/button";
import { Input } from "@/components/ui/atoms/input";
import { Label } from "@/components/ui/atoms/label";
import { Textarea } from "@/components/ui/atoms/textarea";
import { Modal } from "@/components/ui/molecules/modal";
import { useCreateStorageClass, useUpdateStorageClass } from "../hooks/useStorageClasses";
import CapabilityEditor from "./CapabilityEditor";
import ConstraintEditor from "./ConstraintEditor";
import type { StorageClass, StorageCapabilities, StorageConstraints } from "@/lib/types/storage";

interface StorageClassFormProps {
  storageClass?: StorageClass | null;
  onClose: () => void;
}

function normalizeCapabilities(raw: unknown): StorageCapabilities {
  if (!raw || typeof raw !== "object") {
    return { performance: "medium", media: "any", redundancy: "none", shared: false };
  }
  const o = raw as Record<string, unknown>;
  return {
    performance: (o.performance as StorageCapabilities["performance"]) || "medium",
    media: (o.media as StorageCapabilities["media"]) || "any",
    redundancy: (o.redundancy as StorageCapabilities["redundancy"]) || "none",
    shared: Boolean(o.shared),
  };
}

function normalizeConstraints(raw: unknown): StorageConstraints {
  if (!raw || typeof raw !== "object") return {};
  const o = raw as Record<string, unknown>;
  const out: StorageConstraints = {};
  const minIops = o.minIops ?? o.min_iops;
  const maxLatency = o.maxLatencyMs ?? o.max_latency_ms;
  if (typeof minIops === "number" && minIops >= 0) out.minIops = minIops;
  if (typeof maxLatency === "number" && maxLatency >= 0) out.maxLatencyMs = maxLatency;
  return out;
}

export default function StorageClassForm({ storageClass, onClose }: StorageClassFormProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [capabilities, setCapabilities] = useState<StorageCapabilities>(normalizeCapabilities({}));
  const [constraints, setConstraints] = useState<StorageConstraints>({});

  const createMutation = useCreateStorageClass();
  const updateMutation = useUpdateStorageClass();

  useEffect(() => {
    if (storageClass) {
      setName(storageClass.name || "");
      setDescription(storageClass.description || "");
      setCapabilities(normalizeCapabilities(storageClass.capabilities));
      setConstraints(normalizeConstraints(storageClass.constraints));
    } else {
      setName("");
      setDescription("");
      setCapabilities(normalizeCapabilities({}));
      setConstraints({});
    }
  }, [storageClass]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const constraintsPayload: StorageConstraints = { ...constraints };
    if (constraintsPayload.minIops === undefined) delete constraintsPayload.minIops;
    if (constraintsPayload.maxLatencyMs === undefined) delete constraintsPayload.maxLatencyMs;

    try {
      if (storageClass) {
        await updateMutation.mutateAsync({
          name: storageClass.name,
          data: {
            description: description || undefined,
            capabilities,
            constraints: Object.keys(constraintsPayload).length ? constraintsPayload : undefined,
          },
        });
      } else {
        if (!name.trim()) return;
        await createMutation.mutateAsync({
          name: name.trim(),
          description: description || undefined,
          capabilities,
          constraints: Object.keys(constraintsPayload).length ? constraintsPayload : undefined,
        });
      }
      onClose();
    } catch (error) {
      console.error("Failed to save storage class:", error);
    }
  };

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={storageClass ? "Edit storage class" : "Create storage class"}
      size="xl"
      showClose
    >
      <p className="text-sm text-gray-600 mb-4">
        Capability profile and optional constraints (OpenAPI StorageClassCreate /
        StorageClassUpdate).
      </p>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          <div>
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="fast-ssd"
              required={!storageClass}
              disabled={!!storageClass}
              fullWidth
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="High-performance SSD storage for databases"
              rows={2}
              fullWidth
            />
          </div>

          <div>
            <span className="block text-sm font-medium text-gray-700 mb-1">Capabilities</span>
            <CapabilityEditor capabilities={capabilities} onChange={setCapabilities} />
          </div>

          <div>
            <span className="block text-sm font-medium text-gray-700 mb-1">Constraints</span>
            <ConstraintEditor constraints={constraints} onChange={setConstraints} />
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-gray-200">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
            {createMutation.isPending || updateMutation.isPending ? "Saving..." : "Save"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
