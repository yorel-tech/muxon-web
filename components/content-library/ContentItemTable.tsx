"use client";

import { useState, type MouseEvent } from "react";
import { Download, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/atoms/card";
import { Table, Column } from "@/components/ui/organisms/table";
import { Badge } from "@/components/ui/atoms/badge";
import { Button } from "@/components/ui/atoms/button";
import type { ContentItemRow } from "@/types/content-library";
import { formatBytes } from "@/lib/format-bytes";
import { formatDetailDate } from "@/components/entity-detail/DetailRow";
import { downloadPlatformContentItem, downloadTenantContentItem } from "@/lib/api/content-library";

export interface ContentItemTableProps {
  items: ContentItemRow[];
  loading: boolean;
  page: number;
  totalPages: number;
  totalFiltered: number;
  onPageChange: (page: number) => void;
  onRowClick: (item: ContentItemRow) => void;
  emptyMessage?: string;
  /** When set, shows a Download action that calls the content-item download API. */
  downloadContext?: {
    scope: "platform" | "tenant";
    libraryId: string;
    tenantId?: string | null;
  };
}

export function ContentItemTable({
  items,
  loading,
  page,
  totalPages,
  totalFiltered,
  onPageChange,
  onRowClick,
  emptyMessage = "No items in this library.",
  downloadContext,
}: ContentItemTableProps) {
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const columns: Column<ContentItemRow>[] = [
    {
      key: "name",
      header: "Name",
      cell: (row) => (
        <button
          type="button"
          className="font-medium text-left text-primary-600 hover:underline dark:text-primary-400"
          onClick={() => onRowClick(row)}
        >
          {row.name}
        </button>
      ),
      sortable: true,
    },
    {
      key: "contentType",
      header: "Type",
      cell: (row) => <Badge variant="secondary">{row.contentType ?? "—"}</Badge>,
      sortable: true,
    },
    {
      key: "version",
      header: "Version",
      cell: (row) => (
        <span className="text-sm text-gray-600 dark:text-gray-400">{row.version ?? "—"}</span>
      ),
      sortable: true,
    },
    {
      key: "sizeBytes",
      header: "Size",
      cell: (row) => (
        <span className="text-sm text-gray-600 dark:text-gray-400">
          {formatBytes(row.sizeBytes)}
        </span>
      ),
      sortable: true,
    },
    {
      key: "contentStatus",
      header: "Status",
      cell: (row) => {
        const s = (row.contentStatus ?? "").toLowerCase();
        const variant =
          s === "available"
            ? "success"
            : s === "failed"
              ? "error"
              : s === "replicating" || s === "uploading"
                ? "warning"
                : "default";
        return <Badge variant={variant}>{row.contentStatus ?? "—"}</Badge>;
      },
      sortable: true,
    },
    {
      key: "createdAt",
      header: "Created",
      cell: (row) => (
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {formatDetailDate(row.createdAt)}
        </span>
      ),
      sortable: true,
    },
  ];

  if (downloadContext) {
    const { scope, libraryId, tenantId } = downloadContext;
    columns.push({
      key: "download",
      header: "",
      cell: (row) => {
        const busy = downloadingId === row.id;
        const s = (row.contentStatus ?? "").toLowerCase();
        const canTry = s === "available" || s === "uploading";
        const handle = (e: MouseEvent) => {
          e.stopPropagation();
          if (!canTry || busy) return;
          setDownloadingId(row.id);
          void (async () => {
            try {
              const res =
                scope === "platform"
                  ? await downloadPlatformContentItem(libraryId, row.id)
                  : await downloadTenantContentItem(tenantId!, libraryId, row.id);
              if (res?.url) window.open(res.url, "_blank", "noopener,noreferrer");
            } catch {
              // ignore; could toast
            } finally {
              setDownloadingId(null);
            }
          })();
        };
        return (
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="shrink-0"
            disabled={!canTry || busy}
            onClick={handle}
            title={canTry ? "Open download link" : "Content not available in store yet"}
          >
            <Download className="h-4 w-4" />
          </Button>
        );
      },
      sortable: false,
    });
  }

  return (
    <Card bordered>
      <CardContent className="p-0">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        ) : (
          <Table
            columns={columns}
            data={items}
            emptyMessage={emptyMessage}
            overflowVisibleColumnKeys={downloadContext ? ["download"] : []}
          />
        )}
        {!loading && totalFiltered > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-gray-100 dark:border-gray-800 px-4 py-3">
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {totalFiltered} item(s) · Page {page} of {totalPages}
            </span>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                disabled={page <= 1}
                onClick={() => onPageChange(page - 1)}
              >
                Previous
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => onPageChange(page + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
