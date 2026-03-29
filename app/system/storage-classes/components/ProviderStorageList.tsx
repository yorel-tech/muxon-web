"use client";

import { useState } from "react";
import { RefreshCw, Database, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/atoms/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/atoms/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useProviderStorage, useSyncProviderStorage } from "../hooks/useProviderStorage";
import { useProviders } from "@/hooks/useProviders";
import { StorageCapabilitiesBadgeGroup } from "./StorageCapabilitiesBadgeGroup";
import { ProviderStorageDetailPanel } from "./ProviderStorageDetailPanel";
import type { ProviderStorage } from "@/lib/types/storage";

export default function ProviderStorageList() {
  const { data: providers = [], isLoading: providersLoading } = useProviders();
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null);
  const [selectedStorage, setSelectedStorage] = useState<ProviderStorage | null>(null);
  const { data: providerStorage = [], isLoading, error } = useProviderStorage(selectedProvider);
  const syncMutation = useSyncProviderStorage();

  const handleSync = async (providerId: string) => {
    await syncMutation.mutateAsync(providerId);
  };

  if (providersLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

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
        <AlertDescription>Failed to load provider storage: {error.message}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2 flex-wrap items-center">
        {providers.map((provider) => (
          <Button
            key={provider.id}
            variant={selectedProvider === provider.id ? "primary" : "secondary"}
            onClick={() => {
              setSelectedProvider(provider.id);
              setSelectedStorage(null);
            }}
          >
            {provider.name}
          </Button>
        ))}
        <Button
          variant="ghost"
          size="sm"
          className="ml-auto"
          onClick={() => {
            setSelectedProvider(null);
            setSelectedStorage(null);
          }}
        >
          All providers
        </Button>
      </div>

      {selectedProvider && (
        <div className="flex justify-end">
          <Button onClick={() => handleSync(selectedProvider)} disabled={syncMutation.isPending}>
            <RefreshCw className={`h-4 w-4 mr-2 ${syncMutation.isPending ? "animate-spin" : ""}`} />
            Sync storage
          </Button>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          {!providerStorage || providerStorage.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Database className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600">
                  {selectedProvider
                    ? "No storage discovered for this selection"
                    : "Select a provider or load global inventory"}
                </p>
                {selectedProvider && (
                  <Button
                    variant="secondary"
                    className="mt-4"
                    onClick={() => handleSync(selectedProvider)}
                  >
                    Sync storage
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {providerStorage.map((storage: ProviderStorage) => (
                <div
                  key={storage.id}
                  role="button"
                  tabIndex={0}
                  className={`cursor-pointer rounded-lg transition-colors border border-transparent ${selectedStorage?.id === storage.id ? "ring-2 ring-primary-600 border-panel" : "hover:border-panel"}`}
                  onClick={() => setSelectedStorage(storage)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setSelectedStorage(storage);
                    }
                  }}
                >
                  <Card className="h-full">
                  <CardHeader>
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <CardTitle className="text-lg truncate">
                          {storage.name ?? storage.externalId ?? storage.id}
                        </CardTitle>
                        <CardDescription className="!text-gray-600">{storage.storageType}</CardDescription>
                      </div>
                      {storage.enabled !== false ? (
                        <CheckCircle className="h-5 w-5 text-green-500 shrink-0" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-500 shrink-0" />
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <StorageCapabilitiesBadgeGroup capabilities={storage.capabilities} />
                    {storage.metrics && (
                      <div className="text-xs text-gray-600 space-y-0.5">
                        {storage.metrics.freeGb != null && <div>Free: {storage.metrics.freeGb} GB</div>}
                        {storage.metrics.totalGb != null && <div>Total: {storage.metrics.totalGb} GB</div>}
                        {storage.metrics.estimatedIops != null && (
                          <div>IOPS: {storage.metrics.estimatedIops.toLocaleString()}</div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="lg:col-span-1">
          <ProviderStorageDetailPanel storage={selectedStorage} />
        </div>
      </div>
    </div>
  );
}
