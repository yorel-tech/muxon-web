"use client";

import { Label } from "@/components/ui/atoms/label";
import { Select } from "@/components/ui/atoms/select";

import type { StorageCapabilities } from "@/lib/types/storage";

interface CapabilityEditorProps {
  capabilities: StorageCapabilities;
  onChange: (capabilities: StorageCapabilities) => void;
}

export default function CapabilityEditor({ capabilities, onChange }: CapabilityEditorProps) {
  const updateCapability = <K extends keyof StorageCapabilities>(
    key: K,
    value: StorageCapabilities[K]
  ) => {
    onChange({ ...capabilities, [key]: value });
  };

  return (
    <div className="space-y-4 border rounded-lg p-4 border-gray-200">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="performance">Performance</Label>
          <Select
            id="performance"
            placeholder=""
            options={[
              { value: "high", label: "High" },
              { value: "medium", label: "Medium" },
              { value: "low", label: "Low" },
            ]}
            value={(capabilities.performance as string) || "medium"}
            onChange={(value) =>
              updateCapability("performance", value as StorageCapabilities["performance"])
            }
          />
        </div>

        <div>
          <Label htmlFor="media">Media</Label>
          <Select
            id="media"
            placeholder=""
            options={[
              { value: "ssd", label: "SSD" },
              { value: "hdd", label: "HDD" },
              { value: "nvme", label: "NVMe" },
              { value: "any", label: "Any" },
            ]}
            value={(capabilities.media as string) || "any"}
            onChange={(value) => updateCapability("media", value as StorageCapabilities["media"])}
          />
        </div>

        <div>
          <Label htmlFor="redundancy">Redundancy</Label>
          <Select
            id="redundancy"
            placeholder=""
            options={[
              { value: "replicated", label: "Replicated" },
              { value: "none", label: "None" },
            ]}
            value={(capabilities.redundancy as string) || "none"}
            onChange={(value) =>
              updateCapability("redundancy", value as StorageCapabilities["redundancy"])
            }
          />
        </div>

        <div className="flex items-center gap-2 pt-6">
          <input
            id="shared"
            type="checkbox"
            className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            checked={Boolean(capabilities.shared)}
            onChange={(e) => updateCapability("shared", e.target.checked)}
          />
          <Label htmlFor="shared" className="!inline !mb-0">
            Shared storage
          </Label>
        </div>
      </div>
    </div>
  );
}
