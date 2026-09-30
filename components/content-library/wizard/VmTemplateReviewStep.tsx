"use client";

import type { VmTemplateSpec, FileWithMetadata } from "@/types/vm-template-spec";
import { formatBytes } from "@/lib/vm-template-defaults";
import { useState } from "react";

interface VmTemplateReviewStepProps {
  templateSpec: VmTemplateSpec;
  files: FileWithMetadata[];
}

export function VmTemplateReviewStep({ templateSpec, files }: VmTemplateReviewStepProps) {
  const [showJson, setShowJson] = useState(false);

  const totalSize = files.reduce((sum, f) => sum + f.file.size, 0);
  const bootDisk = templateSpec.spec.disks.find((d) => d.bootOrder === 1);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Review & Upload
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Review your VM template configuration before uploading.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Files Summary */}
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-white dark:bg-gray-800">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">Files</h4>
          <dl className="space-y-1 text-sm">
            <div className="flex justify-between">
              <dt className="text-gray-600 dark:text-gray-400">Count:</dt>
              <dd className="text-gray-900 dark:text-gray-100 font-medium">{files.length}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-600 dark:text-gray-400">Total Size:</dt>
              <dd className="text-gray-900 dark:text-gray-100 font-medium">
                {formatBytes(totalSize)}
              </dd>
            </div>
          </dl>
          <div className="mt-3 text-xs text-gray-500 dark:text-gray-400 space-y-1">
            {files.map((f, i) => (
              <div key={i} className="truncate">
                • {f.file.name}
              </div>
            ))}
          </div>
        </div>

        {/* Metadata Summary */}
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-white dark:bg-gray-800">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">Metadata</h4>
          <dl className="space-y-1 text-sm">
            <div className="flex justify-between">
              <dt className="text-gray-600 dark:text-gray-400">Name:</dt>
              <dd className="text-gray-900 dark:text-gray-100 font-medium truncate ml-2">
                {templateSpec.metadata.name}
              </dd>
            </div>
            {templateSpec.metadata.osFamily && (
              <div className="flex justify-between">
                <dt className="text-gray-600 dark:text-gray-400">OS:</dt>
                <dd className="text-gray-900 dark:text-gray-100 font-medium">
                  {templateSpec.metadata.osFamily}
                  {templateSpec.metadata.osDistribution &&
                    ` / ${templateSpec.metadata.osDistribution}`}
                  {templateSpec.metadata.osVersion && ` ${templateSpec.metadata.osVersion}`}
                </dd>
              </div>
            )}
          </dl>
        </div>

        {/* Compute Summary */}
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-white dark:bg-gray-800">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">Compute</h4>
          <dl className="space-y-1 text-sm">
            <div className="flex justify-between">
              <dt className="text-gray-600 dark:text-gray-400">Firmware:</dt>
              <dd className="text-gray-900 dark:text-gray-100 font-medium">
                {templateSpec.spec.firmware.toUpperCase()}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-600 dark:text-gray-400">CPU:</dt>
              <dd className="text-gray-900 dark:text-gray-100 font-medium">
                {templateSpec.spec.compute.cpuCores} cores
                {templateSpec.spec.compute.cpuSockets &&
                  templateSpec.spec.compute.cpuSockets > 1 &&
                  ` × ${templateSpec.spec.compute.cpuSockets} sockets`}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-600 dark:text-gray-400">Memory:</dt>
              <dd className="text-gray-900 dark:text-gray-100 font-medium">
                {(templateSpec.spec.compute.memoryMB / 1024).toFixed(2)} GB
              </dd>
            </div>
          </dl>
        </div>

        {/* Disks Summary */}
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-white dark:bg-gray-800">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">Disks</h4>
          <dl className="space-y-1 text-sm">
            <div className="flex justify-between">
              <dt className="text-gray-600 dark:text-gray-400">Count:</dt>
              <dd className="text-gray-900 dark:text-gray-100 font-medium">
                {templateSpec.spec.disks.length}
              </dd>
            </div>
            {bootDisk && (
              <div className="flex justify-between">
                <dt className="text-gray-600 dark:text-gray-400">Boot Disk:</dt>
                <dd className="text-gray-900 dark:text-gray-100 font-medium">
                  {bootDisk.id} ({bootDisk.bus.toUpperCase()})
                </dd>
              </div>
            )}
          </dl>
        </div>

        {/* Network Summary */}
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-white dark:bg-gray-800">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">Network</h4>
          <dl className="space-y-1 text-sm">
            <div className="flex justify-between">
              <dt className="text-gray-600 dark:text-gray-400">Interfaces:</dt>
              <dd className="text-gray-900 dark:text-gray-100 font-medium">
                {templateSpec.spec.network.length}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-600 dark:text-gray-400">Cloud-Init:</dt>
              <dd className="text-gray-900 dark:text-gray-100 font-medium">
                {templateSpec.spec.cloudInit.enabled ? "Enabled" : "Disabled"}
              </dd>
            </div>
          </dl>
        </div>
      </div>

      {/* JSON View Toggle */}
      <div>
        <button
          type="button"
          onClick={() => setShowJson(!showJson)}
          className="text-sm text-primary hover:text-primary-dark font-medium"
        >
          {showJson ? "▼ Hide" : "▶ Show"} Template Spec JSON
        </button>

        {showJson && (
          <div className="mt-3 rounded-lg bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 p-4 overflow-auto max-h-96">
            <pre className="text-xs text-gray-800 dark:text-gray-200">
              {JSON.stringify(templateSpec, null, 2)}
            </pre>
          </div>
        )}
      </div>

      {/* Important Notice */}
      <div className="rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-4">
        <h5 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2">
          📋 What happens next:
        </h5>
        <ol className="text-sm text-blue-800 dark:text-blue-300 space-y-1 list-decimal list-inside">
          <li>Content item will be created with your template specification</li>
          <li>Each disk file will be uploaded with checksum verification</li>
          <li>Backend will generate template.json and finalize the template</li>
          <li>{'Template status will change to "available" when ready'}</li>
        </ol>
      </div>
    </div>
  );
}
