"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Loader2, Plus } from "lucide-react";
import { Table, Column } from "@/components/ui/organisms/table";
import { ContentPageHeader } from "@/components/ui/organisms/content-page-header";
import { DataRegion } from "@/components/ui/organisms/data-region";
import { Badge } from "@/components/ui/atoms/badge";
import { Button } from "@/components/ui/atoms/button";
import { CreatePlatformContentLibraryModal } from "@/components/content-library/CreatePlatformContentLibraryModal";
import { fetchPlatformContentLibraries } from "@/lib/api/content-library";
import type { ContentLibraryRow } from "@/types/content-library";
import { formatDetailDate } from "@/components/entity-detail/DetailRow";

export default function SystemContentLibrariesPage() {
  const [libraries, setLibraries] = useState<ContentLibraryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchPlatformContentLibraries(1, 200);
      setLibraries(data.items ?? []);
    } catch {
      setLibraries([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const columns: Column<ContentLibraryRow>[] = [
    {
      key: "name",
      header: "Name",
      cell: (row) => (
        <Link
          href={`/system/content-libraries/${row.id}`}
          className="font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
        >
          {row.name}
        </Link>
      ),
      sortable: true,
    },
    {
      key: "description",
      header: "Description",
      cell: (row) => (
        <span className="text-gray-600 dark:text-gray-400 text-sm line-clamp-2">
          {row.description ?? "—"}
        </span>
      ),
      sortable: false,
    },
    {
      key: "type",
      header: "Type",
      cell: (row) => <Badge variant="secondary">{row.type ?? "—"}</Badge>,
      sortable: true,
    },
    {
      key: "accessMode",
      header: "Access",
      cell: (row) => (
        <span className="text-sm text-gray-600 dark:text-gray-400">{row.accessMode ?? "—"}</span>
      ),
      sortable: true,
    },
    {
      key: "syncStatus",
      header: "Sync",
      cell: (row) => (
        <Badge
          variant={
            row.syncStatus === "synced"
              ? "success"
              : row.syncStatus === "failed"
                ? "error"
                : "default"
          }
        >
          {row.syncStatus ?? "—"}
        </Badge>
      ),
      sortable: true,
    },
    {
      key: "lastSyncedAt",
      header: "Last synced",
      cell: (row) => (
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {formatDetailDate(row.lastSyncedAt)}
        </span>
      ),
      sortable: true,
    },
  ];

  return (
    <div className="min-h-screen bg-app">
      <div className="w-full min-w-0 py-8">
        <ContentPageHeader
          title="Content Libraries"
          description="Platform content libraries visible to operators (shared with tenants as read-only)."
          actions={
            <Button
              type="button"
              leftIcon={<Plus className="h-4 w-4" />}
              onClick={() => setCreateOpen(true)}
              className="shrink-0"
            >
              Create library
            </Button>
          }
        />

        <DataRegion>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-console-muted" />
            </div>
          ) : (
            <Table
              presentation="plain"
              columns={columns}
              data={libraries}
              emptyMessage="No content libraries found."
              overflowVisibleColumnKeys={[]}
            />
          )}
        </DataRegion>

        <CreatePlatformContentLibraryModal
          isOpen={createOpen}
          onClose={() => setCreateOpen(false)}
        />
      </div>
    </div>
  );
}
