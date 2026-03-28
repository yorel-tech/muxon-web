"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, RefreshCw } from "lucide-react";
import { Input } from "@/components/ui/atoms/input";
import { Card, CardContent } from "@/components/ui/atoms/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import StorageClassList from "./components/StorageClassList";
import ProviderStorageList from "./components/ProviderStorageList";
import StorageOverrideList from "./components/StorageOverrideList";
import StorageClassForm from "./components/StorageClassForm";
import { useStorageClasses } from "./hooks/useStorageClasses";
import { useQueryClient } from "@tanstack/react-query";
import type { StorageClass } from "@/lib/types/storage";

export default function StorageClassesPage() {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingClass, setEditingClass] = useState<StorageClass | null>(null);
  const [filterQuery, setFilterQuery] = useState("");
  const { refetch } = useStorageClasses();
  const queryClient = useQueryClient();

  const handleCreate = () => {
    setEditingClass(null);
    setShowCreateForm(true);
  };

  const handleEdit = (storageClass: StorageClass) => {
    setEditingClass(storageClass);
    setShowCreateForm(true);
  };

  const handleClose = () => {
    setShowCreateForm(false);
    setEditingClass(null);
    refetch();
  };

  const refreshAll = () => {
    refetch();
    queryClient.invalidateQueries({ queryKey: ["provider-storage"] });
    queryClient.invalidateQueries({ queryKey: ["storage-overrides-aggregated"] });
  };

  return (
    <div className="min-h-screen bg-app">
      <div className="max-w-full px-3 py-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Storage Management</h1>
              <p className="text-gray-600 mt-2">
                Storage classes, provider inventory, and overrides
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={refreshAll}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors font-medium"
              >
                <RefreshCw className="h-4 w-4" />
                <span>Refresh all</span>
              </button>
              <button
                type="button"
                onClick={handleCreate}
                className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
              >
                <Plus className="h-4 w-4" />
                <span>Create storage class</span>
              </button>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Card>
            <CardContent className="p-4 sm:p-6">
              <Tabs defaultValue="storage-classes" className="space-y-4">
                <TabsList className="flex flex-wrap h-auto w-full sm:w-auto gap-1 p-1 justify-start">
                  <TabsTrigger value="storage-classes">Storage classes</TabsTrigger>
                  <TabsTrigger value="provider-storage">Provider storage</TabsTrigger>
                  <TabsTrigger value="overrides">Overrides</TabsTrigger>
                </TabsList>

                <TabsContent value="storage-classes" className="space-y-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center">
                    <Input
                      placeholder="Search by name or description…"
                      value={filterQuery}
                      onChange={(e) => setFilterQuery(e.target.value)}
                      className="max-w-md"
                    />
                  </div>
                  <p className="text-sm text-gray-600">
                    Define capability profiles and constraints used for volume provisioning.
                  </p>
                  <StorageClassList onEdit={handleEdit} filterQuery={filterQuery} />
                </TabsContent>

                <TabsContent value="provider-storage" className="space-y-4">
                  <p className="text-sm text-gray-600">
                    Normalized inventory from providers. Use <strong className="font-medium text-gray-900">Sync storage</strong>{" "}
                    to refresh discovery.
                  </p>
                  <ProviderStorageList />
                </TabsContent>

                <TabsContent value="overrides" className="space-y-4">
                  <p className="text-sm text-gray-600">
                    Per-class override rules (replace set via{" "}
                    <code className="text-xs text-gray-500 bg-gray-100 px-1 py-0.5 rounded">
                      PUT /api/v1/storage-classes/&#123;name&#125;/storage-overrides
                    </code>
                    ).
                  </p>
                  <StorageOverrideList />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {showCreateForm && <StorageClassForm storageClass={editingClass} onClose={handleClose} />}
    </div>
  );
}
