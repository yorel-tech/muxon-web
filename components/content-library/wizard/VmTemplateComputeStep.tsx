"use client";

import type { VmTemplateComputeSpec } from "@/types/vm-template-spec";
import { mbToGb, gbToMb } from "@/lib/vm-template-defaults";

interface VmTemplateComputeStepProps {
  firmware: "bios" | "uefi";
  onFirmwareChange: (firmware: "bios" | "uefi") => void;
  compute: VmTemplateComputeSpec;
  onChange: (compute: VmTemplateComputeSpec) => void;
}

export function VmTemplateComputeStep({
  firmware,
  onFirmwareChange,
  compute,
  onChange,
}: VmTemplateComputeStepProps) {
  const memoryGB = Number(mbToGb(compute.memoryMB));

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Compute & Firmware
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Configure CPU, memory, and firmware settings for the VM template.
        </p>
      </div>

      {/* Firmware */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Firmware <span className="text-red-500">*</span>
        </label>
        <div className="flex gap-4">
          <label className="flex items-center">
            <input
              type="radio"
              value="bios"
              checked={firmware === "bios"}
              onChange={(e) => onFirmwareChange(e.target.value as "bios" | "uefi")}
              className="mr-2"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">BIOS (Legacy)</span>
          </label>
          <label className="flex items-center">
            <input
              type="radio"
              value="uefi"
              checked={firmware === "uefi"}
              onChange={(e) => onFirmwareChange(e.target.value as "bios" | "uefi")}
              className="mr-2"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">UEFI</span>
          </label>
        </div>
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          Choose based on your OS requirements. Modern systems typically use UEFI.
        </p>
      </div>

      {/* CPU Configuration */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            CPU Cores <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            min="1"
            value={compute.cpuCores}
            onChange={(e) => onChange({ ...compute, cpuCores: parseInt(e.target.value) || 1 })}
            className="w-full rounded-md border border-panel bg-surface px-4 py-2 text-gray-900 dark:text-gray-100"
            required
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Minimum: 1 core</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            CPU Sockets
          </label>
          <input
            type="number"
            min="1"
            value={compute.cpuSockets || 1}
            onChange={(e) => onChange({ ...compute, cpuSockets: parseInt(e.target.value) || 1 })}
            className="w-full rounded-md border border-panel bg-surface px-4 py-2 text-gray-900 dark:text-gray-100"
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Default: 1 socket</p>
        </div>
      </div>

      {/* Memory Configuration */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Memory (GB) <span className="text-red-500">*</span>
        </label>
        <input
          type="number"
          min="0.5"
          step="0.5"
          value={memoryGB}
          onChange={(e) => {
            const gb = parseFloat(e.target.value) || 0.5;
            onChange({ ...compute, memoryMB: gbToMb(gb) });
          }}
          className="w-full rounded-md border border-panel bg-surface px-4 py-2 text-gray-900 dark:text-gray-100"
          required
        />
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          {compute.memoryMB} MB • Minimum: 512 MB (0.5 GB)
        </p>
      </div>
    </div>
  );
}
