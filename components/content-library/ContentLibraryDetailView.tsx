"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Loader2, Pencil, Plus, RefreshCw, Upload } from "lucide-react";
import { Button } from "@/components/ui/atoms/button";
import { Tabs } from "@/components/ui/molecules/tabs";
import { ContentItemTable } from "@/components/content-library/ContentItemTable";
import { ContentItemSidePanel } from "@/components/content-library/ContentItemSidePanel";
import { ContentItemUploadModal } from "@/components/content-library/ContentItemUploadModal";
import { EditContentLibraryModal } from "@/components/content-library/EditContentLibraryModal";
import { PublishToDatacenterModal } from "@/components/content-library/PublishToDatacenterModal";
import { DistributionReplicationDrawer } from "@/components/content-library/DistributionReplicationDrawer";
import {
  fetchPlatformContentLibrary,
  fetchTenantContentLibrary,
  listPlatformContentLibraryDistributions,
  listTenantContentLibraryDistributions,
  replicatePlatformContentLibrary,
  syncPlatformContentLibrary,
} from "@/lib/api/content-library";
import type {
  ContentLibraryDistributionRow,
  ContentLibraryRow,
  ContentItemRow,
} from "@/types/content-library";
import { isPlatformContentLibrary, isRemoteContentLibrary } from "@/types/content-library";
import { useContentItems, type ContentTypeTab } from "@/hooks/use-content-items";

const PER_PAGE = 20;

function tabToFilter(tabId: string): ContentTypeTab {
  if (tabId === "vm_template" || tabId === "iso" || tabId === "script") return tabId;
  return "all";
}

export interface ContentLibraryDetailViewProps {
  scope: "platform" | "tenant";
  tenantId: string | null | undefined;
  listHref: string;
}

export function ContentLibraryDetailView({
  scope,
  tenantId,
  listHref,
}: ContentLibraryDetailViewProps) {
  const params = useParams();
  const libraryId = String(params?.id ?? "");
  const [library, setLibrary] = useState<ContentLibraryRow | null>(null);
  const [libLoading, setLibLoading] = useState(true);
  const [libError, setLibError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("all");
  const [page, setPage] = useState(1);
  const [selectedItem, setSelectedItem] = useState<ContentItemRow | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [publishOpen, setPublishOpen] = useState(false);
  const [published, setPublished] = useState<ContentLibraryDistributionRow[]>([]);
  const [pubLoading, setPubLoading] = useState(false);
  const [actionBusy, setActionBusy] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerDist, setDrawerDist] = useState<ContentLibraryDistributionRow | null>(null);

  const filterTab = tabToFilter(activeTab);

  const { items, loading, error, totalPages, totalFiltered, refetch, safePage } = useContentItems({
    libraryId: libraryId || "",
    scope,
    tenantId: tenantId ?? undefined,
    tab: filterTab,
    page,
    perPage: PER_PAGE,
    enabled: !!libraryId && (scope === "platform" || !!tenantId),
  });

  useEffect(() => {
    setActiveTab("all");
    setPage(1);
  }, [libraryId]);

  useEffect(() => {
    setPage(1);
  }, [activeTab]);

  useEffect(() => {
    if (safePage !== page && safePage >= 1) {
      setPage(safePage);
    }
  }, [safePage, page]);

  const loadLibrary = useCallback(async () => {
    if (!libraryId) return;
    setLibLoading(true);
    setLibError(null);
    try {
      const row =
        scope === "platform"
          ? await fetchPlatformContentLibrary(libraryId)
          : await fetchTenantContentLibrary(tenantId!, libraryId);
      setLibrary(row);
    } catch (e) {
      setLibError(e instanceof Error ? e.message : "Failed to load library");
      setLibrary(null);
    } finally {
      setLibLoading(false);
    }
  }, [libraryId, scope, tenantId]);

  useEffect(() => {
    if (scope === "tenant" && !tenantId) {
      setLibLoading(false);
      return;
    }
    void loadLibrary();
  }, [loadLibrary, scope, tenantId]);

  const loadPublished = useCallback(async () => {
    if (!libraryId) return;
    if (scope === "tenant" && !tenantId) return;
    setPubLoading(true);
    try {
      const res =
        scope === "platform"
          ? await listPlatformContentLibraryDistributions(libraryId)
          : await listTenantContentLibraryDistributions(tenantId!, libraryId);
      setPublished(res.items ?? []);
    } catch {
      setPublished([]);
    } finally {
      setPubLoading(false);
    }
  }, [libraryId, scope, tenantId]);

  useEffect(() => {
    if (!library) return;
    void loadPublished();
  }, [library, loadPublished]);

  useEffect(() => {
    const replicating = published.some((p) => p.replicateStatus === "replicating");
    if (!replicating || !libraryId) return;
    const id = window.setInterval(() => {
      void loadPublished();
    }, 5000);
    return () => window.clearInterval(id);
  }, [published, libraryId, loadPublished]);

  useEffect(() => {
    if (!drawerOpen) return;
    setDrawerDist((prev) => {
      if (!prev) return prev;
      const next = published.find((p) => p.id === prev.id);
      return next ?? prev;
    });
  }, [published, drawerOpen]);

  const tenantOwned = !!(tenantId && library?.tenantId === tenantId);
  const readOnlyPlatformInTenantUi =
    scope === "tenant" && !!library && isPlatformContentLibrary(library);
  const canWrite =
    scope === "platform"
      ? true // backend enforces CONTENT_LIBRARY_WRITE
      : tenantOwned && !readOnlyPlatformInTenantUi;

  const showDeployVm = scope === "tenant" && !!tenantId;

  const openPanel = (item: ContentItemRow) => {
    setSelectedItem(item);
    setPanelOpen(true);
  };

  if (!libraryId) {
    return (
      <div className="min-h-screen bg-app px-3 py-8">
        <p className="text-gray-600 dark:text-gray-400">Invalid library.</p>
      </div>
    );
  }

  if (scope === "tenant" && !tenantId) {
    return (
      <div className="min-h-screen bg-app px-3 py-8">
        <p className="text-gray-600 dark:text-gray-400">Select a tenant to view this library.</p>
      </div>
    );
  }

  if (libLoading) {
    return (
      <div className="min-h-screen bg-app flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (libError || !library) {
    return (
      <div className="min-h-screen bg-app px-3 py-8">
        <Link
          href={listHref}
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft size={20} />
          Back
        </Link>
        <p className="text-red-600 dark:text-red-400">{libError ?? "Library not found"}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-app">
      <div className="max-w-full px-3 py-8">
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <Link
            href={listHref}
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
          >
            <ArrowLeft size={20} />
            <span className="font-medium">Back to libraries</span>
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 flex flex-wrap items-start justify-between gap-4"
        >
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{library.name}</h1>
            {library.description && (
              <p className="mt-1 text-gray-600 dark:text-gray-400 text-sm">{library.description}</p>
            )}
            <p className="mt-2 text-xs text-gray-500 dark:text-gray-500">
              Type: {library.type ?? "—"} · Access: {library.accessMode ?? "—"} · Sync:{" "}
              {library.syncStatus ?? "—"}
              {readOnlyPlatformInTenantUi && (
                <span className="ml-2 rounded bg-amber-100 px-2 py-0.5 text-amber-900 dark:bg-amber-900/40 dark:text-amber-100">
                  Platform library (read-only)
                </span>
              )}
            </p>
          </div>
          {canWrite && (
            <div className="flex flex-wrap gap-2">
              <Button
                variant="secondary"
                className="flex items-center gap-2"
                onClick={() => setEditOpen(true)}
              >
                <Pencil size={18} />
                Edit
              </Button>
              <Button className="flex items-center gap-2" onClick={() => setUploadOpen(true)}>
                <Upload size={18} />
                Upload
              </Button>
            </div>
          )}
        </motion.div>

        {scope === "platform" && library && isRemoteContentLibrary(library) && canWrite && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-6 flex flex-wrap gap-2 rounded-lg border border-panel bg-surface p-4"
          >
            <Button
              variant="secondary"
              size="sm"
              className="flex items-center gap-2"
              disabled={!!actionBusy}
              onClick={() => {
                setActionBusy("sync");
                void (async () => {
                  try {
                    await syncPlatformContentLibrary(libraryId);
                    await loadLibrary();
                  } finally {
                    setActionBusy(null);
                  }
                })();
              }}
            >
              <RefreshCw size={16} />
              Sync metadata
            </Button>
            <Button
              size="sm"
              className="flex items-center gap-2"
              disabled={!!actionBusy}
              onClick={() => {
                setActionBusy("repl");
                void (async () => {
                  try {
                    await replicatePlatformContentLibrary(libraryId);
                    await loadLibrary();
                    void refetch();
                  } finally {
                    setActionBusy(null);
                  }
                })();
              }}
            >
              Replicate to content store
            </Button>
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mb-6 rounded-lg border border-panel bg-surface p-4"
        >
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Published datacenters
            </h2>
            {canWrite && (
              <Button
                size="sm"
                className="flex items-center gap-1"
                onClick={() => setPublishOpen(true)}
              >
                <Plus size={16} />
                Publish
              </Button>
            )}
          </div>
          <p className="mb-3 text-xs text-gray-500 dark:text-gray-400">
            Click a datacenter pill to open replication details, per-item status, and actions.
          </p>
          {pubLoading ? (
            <p className="text-sm text-gray-500">Loading…</p>
          ) : published.length === 0 ? (
            <p className="text-sm text-gray-500">Not published to any datacenter yet.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {published.map((m) => {
                const label = m.datacenter?.name?.trim() ? m.datacenter.name : m.datacenterId;
                const pct = Math.min(100, Math.max(0, m.progressPercent ?? 0));
                const status = m.replicateStatus;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => {
                      setDrawerDist(m);
                      setDrawerOpen(true);
                    }}
                    className="min-w-[10rem] max-w-[16rem] flex-1 rounded-lg border border-panel bg-app px-3 py-2 text-left text-sm shadow-sm transition hover:border-blue-400 dark:hover:border-blue-500"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate font-medium text-gray-900 dark:text-gray-100">
                        {label}
                      </span>
                      <span className="shrink-0 text-xs capitalize text-gray-600 dark:text-gray-300">
                        {status}
                      </span>
                    </div>
                    <div className="mt-2 h-1.5 w-full overflow-hidden rounded bg-gray-200 dark:bg-gray-700">
                      <div
                        className={`h-full rounded ${
                          status === "failed"
                            ? "bg-red-500"
                            : status === "available"
                              ? "bg-emerald-500"
                              : "bg-blue-500"
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{pct}%</p>
                    {m.errorMessage ? (
                      <p className="mt-1 line-clamp-2 text-xs text-red-600 dark:text-red-400">
                        {m.errorMessage}
                      </p>
                    ) : null}
                  </button>
                );
              })}
            </div>
          )}
        </motion.div>

        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800 px-4 py-2 text-sm text-red-800 dark:text-red-200">
            {error}
          </div>
        )}

        <Tabs
          key={libraryId}
          variant="underline"
          defaultTab="all"
          tabs={[
            {
              id: "all",
              label: "All",
              content: (
                <ContentItemTable
                  items={items}
                  loading={loading}
                  page={page}
                  totalPages={totalPages}
                  totalFiltered={totalFiltered}
                  onPageChange={setPage}
                  onRowClick={openPanel}
                  downloadContext={{ scope, libraryId, tenantId }}
                />
              ),
            },
            {
              id: "vm_template",
              label: "VM templates",
              content: (
                <ContentItemTable
                  items={items}
                  loading={loading}
                  page={page}
                  totalPages={totalPages}
                  totalFiltered={totalFiltered}
                  onPageChange={setPage}
                  onRowClick={openPanel}
                  downloadContext={{ scope, libraryId, tenantId }}
                />
              ),
            },
            {
              id: "iso",
              label: "ISOs",
              content: (
                <ContentItemTable
                  items={items}
                  loading={loading}
                  page={page}
                  totalPages={totalPages}
                  totalFiltered={totalFiltered}
                  onPageChange={setPage}
                  onRowClick={openPanel}
                  downloadContext={{ scope, libraryId, tenantId }}
                />
              ),
            },
            {
              id: "script",
              label: "Scripts",
              content: (
                <ContentItemTable
                  items={items}
                  loading={loading}
                  page={page}
                  totalPages={totalPages}
                  totalFiltered={totalFiltered}
                  onPageChange={setPage}
                  onRowClick={openPanel}
                  downloadContext={{ scope, libraryId, tenantId }}
                />
              ),
            },
          ]}
          onChange={(id) => setActiveTab(id)}
        />

        <ContentItemSidePanel
          item={selectedItem}
          isOpen={panelOpen}
          onClose={() => {
            setPanelOpen(false);
            setSelectedItem(null);
          }}
          scope={scope}
          libraryId={libraryId}
          tenantId={tenantId}
          canWrite={canWrite}
          showDeployVm={showDeployVm}
          onRefetch={() => void refetch()}
        />

        <ContentItemUploadModal
          isOpen={uploadOpen}
          onClose={() => setUploadOpen(false)}
          libraryId={libraryId}
          scope={scope}
          tenantId={tenantId}
          onUploaded={() => void refetch()}
        />

        <EditContentLibraryModal
          isOpen={editOpen}
          onClose={() => setEditOpen(false)}
          scope={scope}
          tenantId={tenantId}
          library={library}
          onSaved={(row) => setLibrary(row)}
        />

        <PublishToDatacenterModal
          isOpen={publishOpen}
          onClose={() => setPublishOpen(false)}
          scope={scope}
          tenantId={tenantId}
          libraryId={libraryId}
          onPublished={() => void loadPublished()}
        />

        <DistributionReplicationDrawer
          distribution={drawerDist}
          isOpen={drawerOpen}
          onClose={() => {
            setDrawerOpen(false);
            setDrawerDist(null);
          }}
          scope={scope}
          libraryId={libraryId}
          tenantId={tenantId}
          canWrite={canWrite}
          onParentRefresh={() => void loadPublished()}
        />
      </div>
    </div>
  );
}
