"use client";

import { useState } from "react";
import { Plus, RefreshCw } from "lucide-react";
import { Input } from "@/components/ui/atoms/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ContentPageHeader } from "@/components/ui/organisms/content-page-header";
import { DataRegion } from "@/components/ui/organisms/data-region";
import StorageClassList from "./components/StorageClassList";
import ProviderStorageList from "./components/ProviderStorageList";
import StorageOverrideList from "./components/StorageOverrideList";
import StorageClassForm from "./components/StorageClassForm";
import ContentStorageList from "./components/ContentStorageList";
import ContentStorageForm from "./components/ContentStorageForm";
import { useStorageClasses } from "./hooks/useStorageClasses";
import { CONTENT_STORAGES_QUERY_KEY } from "./hooks/useContentStorages";
import { useQueryClient } from "@tanstack/react-query";
import type { StorageClass } from "@/lib/types/storage";
import type { ContentStorageRow } from "@/types/content-storage";

export default function StorageClassesPage() {
  const [activeTab, setActiveTab] = useState("storage-classes");
  const [showStorageClassForm, setShowStorageClassForm] = useState(false);
  const [editingStorageClass, setEditingStorageClass] = useState<StorageClass | null>(null);
  const [showContentStorageForm, setShowContentStorageForm] = useState(false);
  const [editingContentStorage, setEditingContentStorage] = useState<ContentStorageRow | null>(
    null
  );
  const [filterQuery, setFilterQuery] = useState("");
  const { refetch } = useStorageClasses();
  const queryClient = useQueryClient();

  const handleCreatePrimary = () => {
    if (activeTab === "content-storage") {
      setEditingContentStorage(null);
      setShowContentStorageForm(true);
    } else {
      setEditingStorageClass(null);
      setShowStorageClassForm(true);
    }
  };

  const handleEditStorageClass = (storageClass: StorageClass) => {
    setEditingStorageClass(storageClass);
    setShowStorageClassForm(true);
  };

  const handleCloseStorageClassForm = () => {
    setShowStorageClassForm(false);
    setEditingStorageClass(null);
    void refetch();
  };

  const handleEditContentStorage = (row: ContentStorageRow) => {
    setEditingContentStorage(row);
    setShowContentStorageForm(true);
  };

  const handleCloseContentStorageForm = () => {
    setShowContentStorageForm(false);
    setEditingContentStorage(null);
    void queryClient.invalidateQueries({ queryKey: CONTENT_STORAGES_QUERY_KEY });
  };

  const refreshAll = () => {
    void refetch();
    void queryClient.invalidateQueries({ queryKey: ["provider-storage"] });
    void queryClient.invalidateQueries({ queryKey: ["storage-overrides-aggregated"] });
    void queryClient.invalidateQueries({ queryKey: CONTENT_STORAGES_QUERY_KEY });
  };

  const primaryLabel =
    activeTab === "content-storage" ? "Create content storage" : "Create storage class";

  return (
    <div className="min-h-screen bg-app">
      <div className="w-full min-w-0 py-8">
        <ContentPageHeader
          title="Storage Management"
          description="Storage classes, content storage, provider inventory, and overrides"
          actions={
            <>
              <button
                type="button"
                onClick={refreshAll}
                className="flex items-center gap-2 rounded-lg border border-console-control px-4 py-2 font-medium text-[color:var(--text-primary)] transition-colors hover:bg-console-hover"
              >
                <RefreshCw className="h-4 w-4" />
                <span>Refresh all</span>
              </button>
              {(activeTab === "storage-classes" || activeTab === "content-storage") && (
                <button
                  type="button"
                  onClick={handleCreatePrimary}
                  className="flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 font-medium text-white transition-colors hover:bg-primary-700"
                >
                  <Plus className="h-4 w-4" />
                  <span>{primaryLabel}</span>
                </button>
              )}
            </>
          }
        />

        <DataRegion>
          <Tabs
            defaultValue="storage-classes"
            value={activeTab}
            onValueChange={setActiveTab}
            className="space-y-4"
          >
            <TabsList className="flex flex-wrap h-auto w-full sm:w-auto gap-1 p-1 justify-start">
              <TabsTrigger value="storage-classes">Storage classes</TabsTrigger>
              <TabsTrigger value="content-storage">Content storage</TabsTrigger>
              <TabsTrigger value="provider-storage">Provider storage</TabsTrigger>
              <TabsTrigger value="overrides">Overrides</TabsTrigger>
            </TabsList>

            <TabsContent value="storage-classes" className="space-y-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center">
                <Input
                  placeholder="Search by name or description…"
                  value={filterQuery}
                  onChange={(e) => setFilterQuery(e.target.value)}
                  fullWidth
                  aria-label="Search storage classes"
                />
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Define capability profiles and constraints used for volume provisioning.
              </p>
              <StorageClassList onEdit={handleEditStorageClass} filterQuery={filterQuery} />
            </TabsContent>

            <TabsContent value="content-storage" className="space-y-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Backends for content library file uploads (local path, NFS mount, or S3-compatible
                storage).
              </p>
              <ContentStorageList onEdit={handleEditContentStorage} />
            </TabsContent>

            <TabsContent value="provider-storage" className="space-y-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Normalized inventory from providers. Use{" "}
                <strong className="font-medium text-gray-900 dark:text-gray-100">
                  Sync storage
                </strong>{" "}
                to refresh discovery.
              </p>
              <ProviderStorageList />
            </TabsContent>

            <TabsContent value="overrides" className="space-y-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Per-class override rules (replace set via{" "}
                <code className="text-xs text-gray-500 bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded">
                  PUT /api/v1/storage-classes/&#123;name&#125;/storage-overrides
                </code>
                ).
              </p>
              <StorageOverrideList />
            </TabsContent>
          </Tabs>
        </DataRegion>
      </div>

      {showStorageClassForm && (
        <StorageClassForm
          storageClass={editingStorageClass}
          onClose={handleCloseStorageClassForm}
        />
      )}
      {showContentStorageForm && (
        <ContentStorageForm
          storage={editingContentStorage}
          onClose={handleCloseContentStorageForm}
        />
      )}
    </div>
  );
}
