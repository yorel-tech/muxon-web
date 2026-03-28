"use client";

import type { StorageConstraints } from "../types";

export function StorageConstraintsView({ constraints }: { constraints: StorageConstraints | undefined }) {
  if (!constraints || Object.keys(constraints).length === 0) {
    return <p className="text-sm text-gray-500">No constraints</p>;
  }

  return (
    <dl className="text-sm space-y-1 text-gray-600">
      {constraints.minIops != null && (
        <div className="flex gap-2">
          <dt className="font-medium text-gray-900">min IOPS</dt>
          <dd>{constraints.minIops}</dd>
        </div>
      )}
      {constraints.maxLatencyMs != null && (
        <div className="flex gap-2">
          <dt className="font-medium text-gray-900">max latency</dt>
          <dd>{constraints.maxLatencyMs} ms</dd>
        </div>
      )}
    </dl>
  );
}
