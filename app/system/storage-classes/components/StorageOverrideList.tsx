"use client";

import { useState } from "react";
import { Plus, Edit, Trash2, Settings, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/atoms/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/atoms/card";
import { Badge } from "@/components/ui/atoms/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  useStorageOverridesAggregated,
  useRemoveStorageOverrideRow,
} from "../hooks/useStorageOverrides";
import StorageOverrideForm from "./StorageOverrideForm";
import type { StorageOverrideRow } from "@/lib/types/storage";

export default function StorageOverrideList() {
  const { data: rows = [], isLoading, error, refetch } = useStorageOverridesAggregated();
  const removeMutation = useRemoveStorageOverrideRow();
  const [showForm, setShowForm] = useState(false);
  const [editingRow, setEditingRow] = useState<StorageOverrideRow | null>(null);

  const handleCreate = () => {
    setEditingRow(null);
    setShowForm(true);
  };

  const handleEdit = (row: StorageOverrideRow) => {
    setEditingRow(row);
    setShowForm(true);
  };

  const handleDelete = async (row: StorageOverrideRow) => {
    if (confirm("Remove this override rule?")) {
      await removeMutation.mutateAsync(row);
    }
  };

  const handleClose = () => {
    setShowForm(false);
    setEditingRow(null);
    refetch();
  };

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
        <AlertDescription>Failed to load overrides: {error.message}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button
          type="button"
          onClick={handleCreate}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
        >
          <Plus className="h-4 w-4" />
          Create override
        </button>
      </div>

      {rows.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Settings className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600">No override rules configured</p>
            <p className="text-sm text-gray-500 mt-1">
              Add rules to prefer specific provider storage for a storage class
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {rows.map((row) => (
            <Card key={`${row.storageClassName}-${row.index}`}>
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <CardTitle className="text-lg text-gray-900">{row.storageClassName}</CardTitle>
                    <CardDescription className="!text-gray-600">
                      Provider type: {row.override.providerType}
                    </CardDescription>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="!p-2"
                      onClick={() => handleEdit(row)}
                      aria-label="Edit"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="!p-2"
                      onClick={() => handleDelete(row)}
                      aria-label="Delete"
                    >
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Provider storage names</p>
                  <div className="flex gap-2 flex-wrap">
                    {row.override.providerStorageNames.map((name) => (
                      <Badge key={name} variant="outline">
                        {name}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="text-sm text-gray-600 space-y-1">
                  <div>Priority: {row.override.priority ?? 100}</div>
                  {row.override.datacenterId != null && row.override.datacenterId !== "" && (
                    <div>Datacenter: {row.override.datacenterId}</div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {showForm && <StorageOverrideForm editRow={editingRow} onClose={handleClose} />}
    </div>
  );
}
