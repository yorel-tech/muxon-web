"use client";

import { useState, useEffect } from "react";
import { Table, Column } from "@/components/ui/organisms/table";
import { ContentPageHeader } from "@/components/ui/organisms/content-page-header";
import { DataRegion } from "@/components/ui/organisms/data-region";
import { Badge } from "@/components/ui/atoms/badge";
import { Loader2 } from "lucide-react";
import { apiGet } from "@/lib/api";

interface RoleRow {
  id: string;
  name: string;
  description?: string;
  permissions?: string[];
}

export default function TenantRolesPage() {
  const [roles, setRoles] = useState<RoleRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await apiGet<{ items?: RoleRow[] }>("/api/v1/roles");
        const list = Array.isArray(data) ? data : (data?.items ?? []);
        setRoles(
          (list as RoleRow[]).map((r) => ({
            id: String(r.id ?? r.name ?? ""),
            name: String(r.name ?? r.id ?? ""),
            description: r.description,
            permissions: r.permissions ?? [],
          }))
        );
      } catch {
        setRoles([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const columns: Column<RoleRow>[] = [
    {
      key: "name",
      header: "Role",
      cell: (row) => <div className="font-medium text-gray-900 dark:text-gray-100">{row.name}</div>,
      sortable: true,
    },
    {
      key: "description",
      header: "Description",
      cell: (row) => (
        <span className="text-gray-600 dark:text-gray-400 text-sm">{row.description ?? "—"}</span>
      ),
      sortable: true,
    },
    {
      key: "permissions",
      header: "Permissions",
      cell: (row) => (
        <div className="flex flex-wrap gap-1">
          {(row.permissions ?? []).length === 0 ? (
            <span className="text-gray-400 text-sm">—</span>
          ) : (
            (row.permissions ?? []).slice(0, 5).map((p) => (
              <Badge key={p} variant="default" className="text-xs">
                {p}
              </Badge>
            ))
          )}
          {(row.permissions ?? []).length > 5 && (
            <Badge variant="secondary">+{(row.permissions ?? []).length - 5} more</Badge>
          )}
        </div>
      ),
      sortable: false,
    },
  ];

  return (
    <div className="min-h-screen bg-app">
      <div className="w-full min-w-0 py-8">
        <ContentPageHeader title="Roles" />
        <DataRegion>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-console-muted" />
            </div>
          ) : (
            <Table
              presentation="plain"
              columns={columns}
              data={roles}
              emptyMessage="No roles defined"
              overflowVisibleColumnKeys={[]}
            />
          )}
        </DataRegion>
      </div>
    </div>
  );
}
