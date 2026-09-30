"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/atoms/input";
import { Button } from "@/components/ui/atoms/button";
import { Card, CardContent, CardHeader } from "@/components/ui/atoms/card";
import { apiGet } from "@/lib/api";
import { useTenant } from "@/lib/tenant-context";

interface TenantListResponse {
  items?: Array<{ id?: string; name?: string; displayName?: string }>;
}

export default function TenantSelectPage() {
  const router = useRouter();
  const { tenantList, setTenantList, setActiveTenant } = useTenant();
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (tenantList.length > 0) return;
      setLoading(true);
      try {
        const data = await apiGet<TenantListResponse>("/api/v1/tenants/mine");
        const list = (data.items ?? [])
          .filter(
            (t): t is { id: string; name: string; displayName?: string } => !!t.id && !!t.name
          )
          .map((t) => ({ id: t.id, name: t.name, displayName: t.displayName }));
        setTenantList(list);
      } catch {
        setTenantList([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [setTenantList, tenantList.length]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return tenantList;
    return tenantList.filter((t) =>
      `${t.displayName ?? ""} ${t.name}`.toLowerCase().includes(query)
    );
  }, [search, tenantList]);

  const handleSelect = (tenantId: string) => {
    const tenant = tenantList.find((t) => t.id === tenantId) ?? null;
    setActiveTenant(tenant);
    router.replace("/tenant/dashboard");
  };

  return (
    <div className="max-w-3xl w-full py-8">
      <Card>
        <CardHeader>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">Select Tenant</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Choose the tenant context you want to work with.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tenants..."
            fullWidth
          />

          {loading ? (
            <p className="text-sm text-gray-500">Loading tenants...</p>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-gray-500">No tenants found.</p>
          ) : (
            <div className="space-y-2">
              {filtered.map((tenant) => (
                <button
                  key={tenant.id}
                  onClick={() => handleSelect(tenant.id)}
                  className="w-full rounded-lg border border-panel bg-surface px-4 py-3 text-left hover:border-primary-500 transition-colors"
                >
                  <p className="font-medium text-gray-900 dark:text-gray-100">
                    {tenant.displayName || tenant.name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{tenant.name}</p>
                </button>
              ))}
            </div>
          )}

          <Button variant="secondary" onClick={() => router.replace("/")}>
            Back to Home
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
