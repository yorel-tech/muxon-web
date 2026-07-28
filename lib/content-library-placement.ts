import { apiGet } from "@/lib/api";

export interface DatacenterOption {
  id: string;
  name: string;
}

export interface TenantDatacenterGrantBrief {
  id: string;
  datacenterId: string;
  datacenter?: { id?: string; name?: string };
  access?: boolean;
}

export async function fetchDatacenterOptions(): Promise<DatacenterOption[]> {
  const data = await apiGet<
    { items?: { id?: string; name?: string }[] } | { id?: string; name?: string }[]
  >("/api/v1/datacenters?perPage=200");
  const list = Array.isArray(data) ? data : (data?.items ?? []);
  return list
    .filter((dc) => dc?.id)
    .map((dc) => ({ id: dc.id as string, name: (dc.name as string) || (dc.id as string) }));
}

export async function fetchTenantDatacenterGrants(
  tenantId: string
): Promise<TenantDatacenterGrantBrief[]> {
  const data = await apiGet<
    { items?: TenantDatacenterGrantBrief[] } | TenantDatacenterGrantBrief[]
  >(`/api/v1/tenants/${tenantId}/datacenters?perPage=100`);
  const list = Array.isArray(data) ? data : (data?.items ?? []);
  return list.filter((g) => g.access !== false);
}

export function grantDatacenterId(g: TenantDatacenterGrantBrief): string | undefined {
  return g.datacenterId || g.datacenter?.id;
}
