"use client";

import type { VmTemplateDiskSpec } from "@/types/vm-template-spec";
import { formatBytes } from "@/lib/vm-template-defaults";

interface VmTemplateDisksStepProps {
  disks: VmTemplateDiskSpec[];
  onChange: (disks: VmTemplateDiskSpec[]) => void;
}

const DISK_FORMATS = ["qcow2", "vmdk", "raw", "ova", "ovf"] as const;
const DISK_BUS_TYPES = ["scsi", "virtio", "ide", "sata"] as const;

export function VmTemplateDisksStep({ disks, onChange }: VmTemplateDisksStepProps) {
  const updateDisk = (index: number, updates: Partial<VmTemplateDiskSpec>) => {
    const newDisks = [...disks];
    newDisks[index] = { ...newDisks[index], ...updates };
    onChange(newDisks);
  };

  // Validation
  const bootDisks = disks.filter((d) => d.bootOrder === 1);
  const diskIds = disks.map((d) => d.id);
  const hasDuplicateIds = new Set(diskIds).size !== diskIds.length;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Disk Configuration
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Configure each disk with controller settings, bus type, and boot order. Exactly one disk
          must have boot order 1.
        </p>
      </div>

      {/* Validation Warnings */}
      {bootDisks.length !== 1 && (
        <div className="rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 p-3">
          <p className="text-sm text-yellow-800 dark:text-yellow-300">
            ⚠️{" "}
            {bootDisks.length === 0
              ? "No boot disk selected. One disk must have boot order 1."
              : "Multiple boot disks selected. Only one disk can have boot order 1."}
          </p>
        </div>
      )}

      {hasDuplicateIds && (
        <div className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-3">
          <p className="text-sm text-red-800 dark:text-red-300">
            ⚠️ Duplicate disk IDs detected. Each disk must have a unique ID.
          </p>
        </div>
      )}

      {/* Disk List */}
      <div className="space-y-4">
        {disks.map((disk, index) => (
          <div
            key={index}
            className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-white dark:bg-gray-800"
          >
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                Disk {index}
                {disk.bootOrder === 1 && (
                  <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-primary/20 text-primary">
                    Boot Disk
                  </span>
                )}
              </h4>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {formatBytes(disk.sizeBytes)}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Disk ID */}
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Disk ID <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={disk.id}
                  onChange={(e) => updateDisk(index, { id: e.target.value })}
                  className="w-full rounded-md border border-panel bg-surface px-3 py-1.5 text-sm text-gray-900 dark:text-gray-100"
                  required
                />
              </div>

              {/* Disk Name */}
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Name (optional)
                </label>
                <input
                  type="text"
                  value={disk.name || ""}
                  onChange={(e) => updateDisk(index, { name: e.target.value })}
                  placeholder="Display name"
                  className="w-full rounded-md border border-panel bg-surface px-3 py-1.5 text-sm text-gray-900 dark:text-gray-100"
                />
              </div>

              {/* Format */}
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Format <span className="text-red-500">*</span>
                </label>
                <select
                  value={disk.format}
                  onChange={(e) => updateDisk(index, { format: e.target.value as any })}
                  className="w-full rounded-md border border-panel bg-surface px-3 py-1.5 text-sm text-gray-900 dark:text-gray-100"
                >
                  {DISK_FORMATS.map((fmt) => (
                    <option key={fmt} value={fmt}>
                      {fmt.toUpperCase()}
                    </option>
                  ))}
                </select>
              </div>

              {/* Bus */}
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Bus <span className="text-red-500">*</span>
                </label>
                <select
                  value={disk.bus}
                  onChange={(e) => updateDisk(index, { bus: e.target.value as any })}
                  className="w-full rounded-md border border-panel bg-surface px-3 py-1.5 text-sm text-gray-900 dark:text-gray-100"
                >
                  {DISK_BUS_TYPES.map((bus) => (
                    <option key={bus} value={bus}>
                      {bus.toUpperCase()}
                    </option>
                  ))}
                </select>
              </div>

              {/* Controller */}
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Controller
                </label>
                <input
                  type="number"
                  min="0"
                  value={disk.controller || 0}
                  onChange={(e) => updateDisk(index, { controller: parseInt(e.target.value) || 0 })}
                  className="w-full rounded-md border border-panel bg-surface px-3 py-1.5 text-sm text-gray-900 dark:text-gray-100"
                />
              </div>

              {/* Unit */}
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Unit
                </label>
                <input
                  type="number"
                  min="0"
                  value={disk.unit || 0}
                  onChange={(e) => updateDisk(index, { unit: parseInt(e.target.value) || 0 })}
                  className="w-full rounded-md border border-panel bg-surface px-3 py-1.5 text-sm text-gray-900 dark:text-gray-100"
                />
              </div>

              {/* Boot Order */}
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Boot Order <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  value={disk.bootOrder}
                  onChange={(e) => updateDisk(index, { bootOrder: parseInt(e.target.value) || 1 })}
                  className="w-full rounded-md border border-panel bg-surface px-3 py-1.5 text-sm text-gray-900 dark:text-gray-100"
                  required
                />
                <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">1 = boot disk</p>
              </div>

              {/* Read-only */}
              <div className="flex items-center">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={disk.readonly}
                    onChange={(e) => updateDisk(index, { readonly: e.target.checked })}
                    className="mr-2"
                  />
                  <span className="text-xs text-gray-700 dark:text-gray-300">Read-only disk</span>
                </label>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Help Text */}
      <div className="rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-3">
        <p className="text-sm text-blue-800 dark:text-blue-300">
          💡 <strong>Tip:</strong> The disk with boot order 1 will be used as the primary boot
          device. Additional disks can have sequential boot orders (2, 3, etc.) as fallback boot
          devices.
        </p>
      </div>
    </div>
  );
}
