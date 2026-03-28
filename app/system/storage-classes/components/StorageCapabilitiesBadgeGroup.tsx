"use client";

import type { StorageCapabilities, ProviderStorageCapabilities } from "../types";
import { Badge } from "@/components/ui/atoms/badge";

type Caps = StorageCapabilities | ProviderStorageCapabilities | undefined;

export function StorageCapabilitiesBadgeGroup({ capabilities }: { capabilities: Caps }) {
  if (!capabilities || typeof capabilities !== "object") {
    return <span className="text-sm text-gray-500">No capabilities</span>;
  }

  const entries = Object.entries(capabilities).filter(
    ([, v]) => v !== undefined && v !== null && v !== "",
  );

  if (entries.length === 0) {
    return <span className="text-sm text-gray-500">No capabilities</span>;
  }

  return (
    <div className="flex gap-2 flex-wrap">
      {entries.map(([key, value]) => (
        <Badge key={key} variant="secondary" className="font-normal">
          {key}: {String(value)}
        </Badge>
      ))}
    </div>
  );
}
