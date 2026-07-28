"use client";

import { Edit, Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/atoms/button";
import { Badge } from "@/components/ui/atoms/badge";
import { Table, type Column } from "@/components/ui/organisms/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useContentStoragesList, useDeleteContentStorage } from "../hooks/useContentStorages";
import { formatDetailDate } from "@/components/entity-detail/DetailRow";
import type { ContentStorageRow } from "@/types/content-storage";

function configSummary(row: ContentStorageRow): string {
  const c = row.config ?? {};
  switch (row.type) {
    case "local":
      return (c.path as string)?.trim() ? String(c.path) : "(runtime default)";
    case "nfs":
      return (c.mountPath as string) || "—";
    case "s3":
      return [c.bucket, c.region].filter(Boolean).join(" · ") || "—";
    default:
      return "—";
  }
}

interface ContentStorageListProps {
  onEdit: (row: ContentStorageRow) => void;
}

export default function ContentStorageList({ onEdit }: ContentStorageListProps) {
  const { data: rows = [], isLoading, error } = useContentStoragesList();
  const deleteMutation = useDeleteContentStorage();

  const handleDelete = async (row: ContentStorageRow) => {
    if (
      !confirm(
        `Delete content storage "${row.name}"? Libraries referencing it cannot be deleted until reassigned.`
      )
    ) {
      return;
    }
    await deleteMutation.mutateAsync(row.id);
  };

  const columns: Column<ContentStorageRow>[] = [
    {
      key: "name",
      header: "Name",
      cell: (r) => <span className="font-medium text-gray-900 dark:text-gray-100">{r.name}</span>,
      sortable: true,
    },
    {
      key: "type",
      header: "Type",
      cell: (r) => (
        <Badge variant="secondary" className="capitalize">
          {r.type}
        </Badge>
      ),
      sortable: true,
    },
    {
      key: "config",
      header: "Target",
      cell: (r) => (
        <span className="text-sm text-gray-600 dark:text-gray-400 font-mono truncate max-w-md inline-block">
          {configSummary(r)}
        </span>
      ),
    },
    {
      key: "isDefault",
      header: "Default",
      cell: (r) =>
        r.isDefault ? (
          <Badge variant="success">Default</Badge>
        ) : (
          <span className="text-sm text-gray-500">—</span>
        ),
    },
    {
      key: "createdAt",
      header: "Created",
      cell: (r) => (
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {formatDetailDate(r.createdAt)}
        </span>
      ),
      sortable: true,
    },
    {
      key: "actions",
      header: "",
      cell: (r) => (
        <div className="flex justify-end gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="!p-2"
            onClick={() => onEdit(r)}
            aria-label="Edit"
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="!p-2"
            onClick={() => void handleDelete(r)}
            disabled={deleteMutation.isPending}
            aria-label="Delete"
          >
            <Trash2 className="h-4 w-4 text-red-600" />
          </Button>
        </div>
      ),
    },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>Failed to load content storages: {error.message}</AlertDescription>
      </Alert>
    );
  }

  return (
    <Table
      columns={columns}
      data={rows}
      emptyMessage="No content storages configured."
      overflowVisibleColumnKeys={["actions"]}
    />
  );
}
