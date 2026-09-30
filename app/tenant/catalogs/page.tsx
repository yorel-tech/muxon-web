"use client";

import { useState, useEffect } from "react";
import { Table, Column } from "@/components/ui/organisms/table";
import { ContentPageHeader } from "@/components/ui/organisms/content-page-header";
import { DataRegion } from "@/components/ui/organisms/data-region";
import { Loader2 } from "lucide-react";
import { apiGet } from "@/lib/api";

interface CatalogRow {
  id: string;
  name: string;
  description?: string;
  type?: string;
}

export default function TenantCatalogsPage() {
  const [catalogs, setCatalogs] = useState<CatalogRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await apiGet<{ items?: CatalogRow[] }>("/api/v1/catalogs");
        const list = Array.isArray(data) ? data : (data?.items ?? []);
        setCatalogs(
          (list as CatalogRow[]).map((c) => ({
            id: String(c.id ?? ""),
            name: String(c.name ?? c.id ?? ""),
            description: c.description,
            type: c.type,
          }))
        );
      } catch {
        setCatalogs([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const columns: Column<CatalogRow>[] = [
    {
      key: "name",
      header: "Name",
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
      key: "type",
      header: "Type",
      cell: (row) => (
        <span className="text-gray-600 dark:text-gray-400 text-sm">{row.type ?? "—"}</span>
      ),
      sortable: true,
    },
  ];

  return (
    <div className="min-h-screen bg-app">
      <div className="w-full min-w-0 py-8">
        <ContentPageHeader title="Catalogs" />
        <DataRegion>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-console-muted" />
            </div>
          ) : (
            <Table
              presentation="plain"
              columns={columns}
              data={catalogs}
              emptyMessage="No catalogs available"
              overflowVisibleColumnKeys={[]}
            />
          )}
        </DataRegion>
      </div>
    </div>
  );
}
