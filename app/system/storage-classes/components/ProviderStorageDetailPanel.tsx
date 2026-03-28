"use client";

import type { ProviderStorage } from "../types";
import { StorageCapabilitiesBadgeGroup } from "./StorageCapabilitiesBadgeGroup";
import { Badge } from "@/components/ui/atoms/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/atoms/card";

export function ProviderStorageDetailPanel({ storage }: { storage: ProviderStorage | null }) {
  if (!storage) {
    return (
      <Card className="border-dashed border-gray-300 bg-gray-50/80">
        <CardContent className="py-10 text-center text-sm text-gray-600">
          Select a storage item to view details
        </CardContent>
      </Card>
    );
  }

  const m = storage.metrics ?? {};

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg text-gray-900">
          {storage.name ?? storage.externalId ?? storage.id}
        </CardTitle>
        <p className="text-sm text-gray-600">{storage.storageType}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <Badge variant={storage.enabled !== false ? "success" : "error"}>
            {storage.enabled !== false ? "enabled" : "disabled"}
          </Badge>
          <Badge variant="outline">{storage.providerType}</Badge>
        </div>

        <div>
          <p className="text-sm font-medium text-gray-700 mb-2">Capabilities</p>
          <StorageCapabilitiesBadgeGroup capabilities={storage.capabilities} />
        </div>

        <div>
          <p className="text-sm font-medium text-gray-700 mb-2">Metrics</p>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm text-gray-600">
            {m.totalGb != null && (
              <>
                <dt className="text-gray-900 font-medium">Total</dt>
                <dd>{m.totalGb} GB</dd>
              </>
            )}
            {m.freeGb != null && (
              <>
                <dt className="text-gray-900 font-medium">Free</dt>
                <dd>{m.freeGb} GB</dd>
              </>
            )}
            {m.usedGb != null && (
              <>
                <dt className="text-gray-900 font-medium">Used</dt>
                <dd>{m.usedGb} GB</dd>
              </>
            )}
            {m.estimatedIops != null && (
              <>
                <dt className="text-gray-900 font-medium">Est. IOPS</dt>
                <dd>{m.estimatedIops.toLocaleString()}</dd>
              </>
            )}
            {m.latencyMs != null && (
              <>
                <dt className="text-gray-900 font-medium">Latency</dt>
                <dd>{m.latencyMs} ms</dd>
              </>
            )}
          </dl>
          {Object.keys(m).length === 0 && (
            <p className="text-sm text-gray-500">No metrics reported</p>
          )}
        </div>

        {storage.mappedStorageClasses && storage.mappedStorageClasses.length > 0 && (
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Mapped classes</p>
            <div className="flex flex-wrap gap-2">
              {storage.mappedStorageClasses.map((x) => (
                <Badge key={`${x.storageClassName}-${x.mappingSource}`} variant="outline">
                  {x.storageClassName} ({x.mappingSource})
                </Badge>
              ))}
            </div>
          </div>
        )}

        <div className="text-xs text-gray-500 space-y-1 border-t border-gray-100 pt-3">
          {storage.nodeId && <div>Node: {storage.nodeId}</div>}
          <div>ID: {storage.id}</div>
          {storage.externalId && <div>External: {storage.externalId}</div>}
        </div>
      </CardContent>
    </Card>
  );
}
