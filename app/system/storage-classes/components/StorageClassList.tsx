"use client";

import { Edit, Trash2, HardDrive, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/atoms/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/atoms/card";
import { useStorageClasses, useDeleteStorageClass } from "../hooks/useStorageClasses";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { StorageCapabilitiesBadgeGroup } from "./StorageCapabilitiesBadgeGroup";
import { StorageConstraintsView } from "./StorageConstraintsView";
import type { StorageClass } from "@/lib/types/storage";

interface StorageClassListProps {
  onEdit: (storageClass: StorageClass) => void;
  filterQuery?: string;
}

export default function StorageClassList({ onEdit, filterQuery = "" }: StorageClassListProps) {
  const { data: storageClasses = [], isLoading, error } = useStorageClasses();
  const deleteStorageClass = useDeleteStorageClass();

  const handleDelete = async (name: string) => {
    if (confirm(`Are you sure you want to delete storage class "${name}"?`)) {
      await deleteStorageClass.mutateAsync(name);
    }
  };

  const q = filterQuery.trim().toLowerCase();
  const filtered = q
    ? storageClasses.filter(
        (sc) =>
          sc.name.toLowerCase().includes(q) ||
          (sc.description ?? "").toLowerCase().includes(q),
      )
    : storageClasses;

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
        <AlertDescription>Failed to load storage classes: {error.message}</AlertDescription>
      </Alert>
    );
  }

  if (storageClasses.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <HardDrive className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <p className="text-gray-600">No storage classes defined</p>
          <p className="text-sm text-gray-500 mt-1">
            Create a storage class to define storage capabilities
          </p>
        </CardContent>
      </Card>
    );
  }

  if (filtered.length === 0) {
    return (
      <p className="text-sm text-gray-600 text-center py-8">
        No storage classes match “{filterQuery}”.
      </p>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {filtered.map((sc) => (
        <Card key={sc.name} className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <CardTitle className="text-lg truncate">{sc.name}</CardTitle>
                <CardDescription className="line-clamp-2 !text-gray-600">
                  {sc.description || "No description"}
                </CardDescription>
              </div>
              <div className="flex gap-1 shrink-0">
                <Button variant="ghost" size="sm" className="!p-2" onClick={() => onEdit(sc)} aria-label="Edit">
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="!p-2"
                  onClick={() => handleDelete(sc.name)}
                  aria-label="Delete"
                >
                  <Trash2 className="h-4 w-4 text-red-600" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Capabilities</p>
              <StorageCapabilitiesBadgeGroup capabilities={sc.capabilities} />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Constraints</p>
              <StorageConstraintsView constraints={sc.constraints} />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
