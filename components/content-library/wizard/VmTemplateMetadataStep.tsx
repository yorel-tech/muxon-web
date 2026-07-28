"use client";

import type { VmTemplateSpecMetadata } from "@/types/vm-template-spec";

interface VmTemplateMetadataStepProps {
  metadata: VmTemplateSpecMetadata;
  onChange: (metadata: VmTemplateSpecMetadata) => void;
}

const OS_FAMILIES = [
  { value: "linux", label: "Linux" },
  { value: "windows", label: "Windows" },
  { value: "other", label: "Other" },
];

export function VmTemplateMetadataStep({ metadata, onChange }: VmTemplateMetadataStepProps) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Template Metadata
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Provide information about the operating system and template details.
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Template Name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={metadata.name}
          onChange={(e) => onChange({ ...metadata, name: e.target.value })}
          placeholder="e.g., ubuntu-22-04-server"
          className="w-full rounded-md border border-panel bg-surface px-4 py-2 text-gray-900 dark:text-gray-100"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Description
        </label>
        <textarea
          value={metadata.description || ""}
          onChange={(e) => onChange({ ...metadata, description: e.target.value })}
          placeholder="e.g., Ubuntu 22.04 LTS Server with standard configuration"
          rows={3}
          className="w-full rounded-md border border-panel bg-surface px-4 py-2 text-gray-900 dark:text-gray-100"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            OS Family
          </label>
          <select
            value={metadata.osFamily || "linux"}
            onChange={(e) =>
              onChange({ ...metadata, osFamily: e.target.value as "linux" | "windows" | "other" })
            }
            className="w-full rounded-md border border-panel bg-surface px-4 py-2 text-gray-900 dark:text-gray-100"
          >
            {OS_FAMILIES.map((os) => (
              <option key={os.value} value={os.value}>
                {os.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            OS Distribution
          </label>
          <input
            type="text"
            value={metadata.osDistribution || ""}
            onChange={(e) => onChange({ ...metadata, osDistribution: e.target.value })}
            placeholder="e.g., ubuntu, centos"
            className="w-full rounded-md border border-panel bg-surface px-4 py-2 text-gray-900 dark:text-gray-100"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            OS Version
          </label>
          <input
            type="text"
            value={metadata.osVersion || ""}
            onChange={(e) => onChange({ ...metadata, osVersion: e.target.value })}
            placeholder="e.g., 22.04"
            className="w-full rounded-md border border-panel bg-surface px-4 py-2 text-gray-900 dark:text-gray-100"
          />
        </div>
      </div>
    </div>
  );
}
