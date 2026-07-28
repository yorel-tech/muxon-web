"use client";

import type { VmTemplateNetworkSpec, VmTemplateCloudInitSpec } from "@/types/vm-template-spec";
import { Button } from "@/components/ui/atoms/button";

interface VmTemplateNetworkStepProps {
  network: VmTemplateNetworkSpec[];
  onNetworkChange: (network: VmTemplateNetworkSpec[]) => void;
  cloudInit: VmTemplateCloudInitSpec;
  onCloudInitChange: (cloudInit: VmTemplateCloudInitSpec) => void;
}

const NETWORK_MODELS = ["virtio", "e1000", "vmxnet3"] as const;

export function VmTemplateNetworkStep({
  network,
  onNetworkChange,
  cloudInit,
  onCloudInitChange,
}: VmTemplateNetworkStepProps) {
  const addNetworkInterface = () => {
    const newId = `net-${network.length}`;
    onNetworkChange([...network, { id: newId, model: "virtio" }]);
  };

  const removeNetworkInterface = (index: number) => {
    if (network.length > 1) {
      onNetworkChange(network.filter((_, i) => i !== index));
    }
  };

  const updateNetworkInterface = (index: number, updates: Partial<VmTemplateNetworkSpec>) => {
    const newNetwork = [...network];
    newNetwork[index] = { ...newNetwork[index], ...updates };
    onNetworkChange(newNetwork);
  };

  // Check for duplicate IDs
  const networkIds = network.map((n) => n.id);
  const hasDuplicateIds = new Set(networkIds).size !== networkIds.length;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Network & Cloud-Init
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Configure network interfaces and cloud-init support. At least one network interface is
          required.
        </p>
      </div>

      {/* Validation Warning */}
      {hasDuplicateIds && (
        <div className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-3">
          <p className="text-sm text-red-800 dark:text-red-300">
            ⚠️ Duplicate network interface IDs detected. Each interface must have a unique ID.
          </p>
        </div>
      )}

      {/* Network Interfaces */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Network Interfaces
          </h4>
          <Button
            type="button"
            variant="secondary"
            onClick={addNetworkInterface}
            className="text-sm"
          >
            + Add Interface
          </Button>
        </div>

        {network.map((iface, index) => (
          <div
            key={index}
            className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-white dark:bg-gray-800"
          >
            <div className="flex items-center justify-between mb-3">
              <h5 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                Network Interface {index}
              </h5>
              {network.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeNetworkInterface(index)}
                  className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 text-sm"
                >
                  Remove
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Interface ID */}
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Interface ID <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={iface.id}
                  onChange={(e) => updateNetworkInterface(index, { id: e.target.value })}
                  className="w-full rounded-md border border-panel bg-surface px-3 py-1.5 text-sm text-gray-900 dark:text-gray-100"
                  required
                />
              </div>

              {/* Model */}
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Model <span className="text-red-500">*</span>
                </label>
                <select
                  value={iface.model}
                  onChange={(e) => updateNetworkInterface(index, { model: e.target.value as any })}
                  className="w-full rounded-md border border-panel bg-surface px-3 py-1.5 text-sm text-gray-900 dark:text-gray-100"
                >
                  {NETWORK_MODELS.map((model) => (
                    <option key={model} value={model}>
                      {model === "virtio" ? "VirtIO (Recommended)" : model.toUpperCase()}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Cloud-Init */}
      <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          Cloud-Init Configuration
        </h4>

        <label className="flex items-start cursor-pointer">
          <input
            type="checkbox"
            checked={cloudInit.enabled}
            onChange={(e) => onCloudInitChange({ enabled: e.target.checked })}
            className="mt-1 mr-3"
          />
          <div>
            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
              Enable Cloud-Init support
            </span>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Cloud-init allows automatic configuration of VMs on first boot, including network
              setup, SSH keys, user creation, and package installation.
            </p>
          </div>
        </label>
      </div>

      {/* Help Text */}
      <div className="rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-3">
        <p className="text-sm text-blue-800 dark:text-blue-300">
          💡 <strong>Tip:</strong> VirtIO network model provides the best performance for Linux
          guests. Use E1000 for better compatibility with older operating systems.
        </p>
      </div>
    </div>
  );
}
