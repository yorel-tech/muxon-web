"use client";

import { useState, useEffect, useCallback } from "react";
import { Table, Column } from "@/components/ui/organisms/table";
import { ContentPageHeader } from "@/components/ui/organisms/content-page-header";
import { DataRegion } from "@/components/ui/organisms/data-region";
import { Loader2 } from "lucide-react";
import { apiGet } from "@/lib/api";
import { useTenantId } from "@/lib/use-tenant-id";

/** ResourceLimits per OpenAPI commons */
interface ResourceLimits {
  maxCpus?: number;
  maxMemoryGb?: number;
  maxStorageGb?: number;
  maxVms?: number;
  maxVolumes?: number;
  maxLoadBalancers?: number;
}

/** Tenant datacenter grant (from GET /api/v1/tenants/{tenantId}/datacenters) */
interface TenantDatacenterGrant {
  id: string;
  tenantId?: string;
  datacenterId: string;
  datacenter?: { id: string; name?: string; description?: string };
  access?: boolean;
  limits?: ResourceLimits;
}

function formatLimits(l: ResourceLimits | undefined): string {
  if (
    !l ||
    (l.maxVms == null && l.maxCpus == null && l.maxMemoryGb == null && l.maxStorageGb == null)
  )
    return "—";
  const parts = [
    l.maxVms != null && `VMs: ${l.maxVms}`,
    l.maxCpus != null && `vCPUs: ${l.maxCpus}`,
    l.maxMemoryGb != null && `RAM: ${l.maxMemoryGb} GB`,
    l.maxStorageGb != null && `Storage: ${l.maxStorageGb} GB`,
  ].filter(Boolean);
  return parts.join(", ");
}

export default function TenantDatacentersPage() {
  const { tenantId, loading: tenantLoading, error: tenantError } = useTenantId();
  const [grants, setGrants] = useState<TenantDatacenterGrant[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!tenantId) {
      setGrants([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await apiGet<{ items?: TenantDatacenterGrant[] } | TenantDatacenterGrant[]>(
        `/api/v1/tenants/${tenantId}/datacenters?perPage=100`
      );
      const list = Array.isArray(data) ? data : (data?.items ?? []);
      const withAccess = list.filter((g: TenantDatacenterGrant) => g.access !== false);
      setGrants(withAccess);
    } catch {
      setGrants([]);
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  useEffect(() => {
    load();
  }, [load]);

  const columns: Column<TenantDatacenterGrant>[] = [
    {
      key: "name",
      header: "Name",
      cell: (row) => (
        <div className="font-medium text-gray-900 dark:text-gray-100">
          {row.datacenter?.name ?? row.datacenterId}
        </div>
      ),
      sortable: true,
    },
    {
      key: "description",
      header: "Description",
      cell: (row) => (
        <span className="text-gray-600 dark:text-gray-400 text-sm">
          {row.datacenter?.description ?? "—"}
        </span>
      ),
      sortable: true,
    },
    {
      key: "limits",
      header: "Limits",
      cell: (row) => (
        <span className="text-gray-600 dark:text-gray-400 text-sm">{formatLimits(row.limits)}</span>
      ),
      sortable: false,
    },
  ];

  return (
    <div className="min-h-screen bg-app">
      <div className="w-full min-w-0 py-8">
        <ContentPageHeader title="Datacenters" />
        <DataRegion>
          {tenantError && (
            <div className="border-b border-amber-200 bg-amber-50 p-4 text-sm text-amber-700 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-200">
              {tenantError}. Select a tenant from the system tenant list to open the portal.
            </div>
          )}
          {tenantLoading || loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-console-muted" />
            </div>
          ) : !tenantId ? (
            <div className="py-12 text-center text-sm text-console-muted">
              No tenant selected. Open the tenant portal from a tenant in the system area.
            </div>
          ) : (
            <Table
              presentation="plain"
              columns={columns}
              data={grants}
              emptyMessage="No datacenters available"
              overflowVisibleColumnKeys={[]}
            />
          )}
        </DataRegion>
      </div>
    </div>
  );
}
