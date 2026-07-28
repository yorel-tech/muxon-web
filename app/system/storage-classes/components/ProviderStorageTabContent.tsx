"use client";

import { RefreshCw, HardDrive, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/atoms/button";
import { Card, CardContent } from "@/components/ui/atoms/card";
import { Badge } from "@/components/ui/atoms/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Link from "next/link";
import { useProviderStorage, useSyncProviderStorage } from "../hooks/useProviderStorage";
import { StorageCapabilitiesBadgeGroup } from "./StorageCapabilitiesBadgeGroup";
import type { ProviderStorage } from "@/lib/types/storage";

interface ProviderStorageTabContentProps {
  providerId: string;
  providerOffline?: boolean;
}

export function ProviderStorageTabContent({
  providerId,
  providerOffline = false,
}: ProviderStorageTabContentProps) {
  const { data: rows = [], isLoading, error, refetch } = useProviderStorage(providerId);
  const syncMutation = useSyncProviderStorage();

  const handleSync = async () => {
    await syncMutation.mutateAsync(providerId);
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
        <AlertDescription>
          Failed to load provider storage:{" "}
          {error instanceof Error ? error.message : "Unknown error"}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-gray-600">
          Discovered storage for this provider. Manage classes and global inventory in{" "}
          <Link
            href="/system/storage-classes"
            className="text-primary-600 hover:text-primary-700 font-medium"
          >
            Storage Management
          </Link>
          .
        </p>
        <button
          type="button"
          onClick={handleSync}
          disabled={syncMutation.isPending || providerOffline}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <RefreshCw className={`h-4 w-4 ${syncMutation.isPending ? "animate-spin" : ""}`} />
          Sync storage
        </button>
      </div>

      {rows.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <HardDrive className="h-10 w-10 mx-auto text-gray-400 mb-2" />
            <p className="text-sm text-gray-600">No storage discovered yet.</p>
            <Button
              variant="secondary"
              className="mt-4"
              onClick={handleSync}
              disabled={providerOffline}
            >
              Run discovery sync
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {rows.map((s: ProviderStorage) => (
            <Card key={s.id}>
              <CardContent className="pt-4 space-y-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <h4 className="font-medium text-gray-900">{s.name ?? s.externalId ?? s.id}</h4>
                    <p className="text-sm text-gray-600">{s.storageType}</p>
                  </div>
                  <Badge variant={s.enabled !== false ? "success" : "error"}>
                    {s.enabled !== false ? "enabled" : "disabled"}
                  </Badge>
                </div>
                <StorageCapabilitiesBadgeGroup capabilities={s.capabilities} />
                {s.mappedStorageClasses && s.mappedStorageClasses.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {s.mappedStorageClasses.map((m) => (
                      <Badge
                        key={`${m.storageClassName}-${m.mappingSource}`}
                        variant="outline"
                        className="text-xs"
                      >
                        {m.storageClassName}
                      </Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
