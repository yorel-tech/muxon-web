'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, Loader2, Upload } from 'lucide-react';
import { Button } from '@/components/ui/atoms/button';
import { Tabs } from '@/components/ui/molecules/tabs';
import { ContentItemTable } from '@/components/content-library/ContentItemTable';
import { ContentItemSidePanel } from '@/components/content-library/ContentItemSidePanel';
import { ContentItemUploadModal } from '@/components/content-library/ContentItemUploadModal';
import {
  fetchPlatformContentLibrary,
  fetchTenantContentLibrary,
} from '@/lib/api/content-library';
import type { ContentLibraryRow, ContentItemRow } from '@/types/content-library';
import { useContentItems, type ContentTypeTab } from '@/hooks/use-content-items';

const PER_PAGE = 20;

function tabToFilter(tabId: string): ContentTypeTab {
  if (tabId === 'vm_template' || tabId === 'iso' || tabId === 'script') return tabId;
  return 'all';
}

export interface ContentLibraryDetailViewProps {
  scope: 'platform' | 'tenant';
  tenantId: string | null | undefined;
  listHref: string;
}

export function ContentLibraryDetailView({ scope, tenantId, listHref }: ContentLibraryDetailViewProps) {
  const params = useParams();
  const libraryId = String(params?.id ?? '');
  const [library, setLibrary] = useState<ContentLibraryRow | null>(null);
  const [libLoading, setLibLoading] = useState(true);
  const [libError, setLibError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('all');
  const [page, setPage] = useState(1);
  const [selectedItem, setSelectedItem] = useState<ContentItemRow | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);

  const filterTab = tabToFilter(activeTab);

  const { items, loading, error, totalPages, totalFiltered, refetch, safePage } = useContentItems({
    libraryId: libraryId || '',
    scope,
    tenantId: tenantId ?? undefined,
    tab: filterTab,
    page,
    perPage: PER_PAGE,
    enabled: !!libraryId && (scope === 'platform' || !!tenantId),
  });

  useEffect(() => {
    setActiveTab('all');
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
        scope === 'platform'
          ? await fetchPlatformContentLibrary(libraryId)
          : await fetchTenantContentLibrary(tenantId!, libraryId);
      setLibrary(row);
    } catch (e) {
      setLibError(e instanceof Error ? e.message : 'Failed to load library');
      setLibrary(null);
    } finally {
      setLibLoading(false);
    }
  }, [libraryId, scope, tenantId]);

  useEffect(() => {
    if (scope === 'tenant' && !tenantId) {
      setLibLoading(false);
      return;
    }
    void loadLibrary();
  }, [loadLibrary, scope, tenantId]);

  const tenantOwned = !!(tenantId && library?.tenantId === tenantId);
  const canWrite =
    scope === 'platform'
      ? true // backend enforces CONTENT_LIBRARY_WRITE
      : tenantOwned;

  const showDeployVm = scope === 'tenant' && !!tenantId;

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

  if (scope === 'tenant' && !tenantId) {
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
        <Link href={listHref} className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6">
          <ArrowLeft size={20} />
          Back
        </Link>
        <p className="text-red-600 dark:text-red-400">{libError ?? 'Library not found'}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-app">
      <div className="max-w-full px-3 py-8">
        <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
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
              Type: {library.type ?? '—'} · Access: {library.accessMode ?? '—'} · Sync: {library.syncStatus ?? '—'}
            </p>
          </div>
          {canWrite && (
            <Button className="flex items-center gap-2" onClick={() => setUploadOpen(true)}>
              <Upload size={18} />
              Upload
            </Button>
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
              id: 'all',
              label: 'All',
              content: (
                <ContentItemTable
                  items={items}
                  loading={loading}
                  page={page}
                  totalPages={totalPages}
                  totalFiltered={totalFiltered}
                  onPageChange={setPage}
                  onRowClick={openPanel}
                />
              ),
            },
            {
              id: 'vm_template',
              label: 'VM templates',
              content: (
                <ContentItemTable
                  items={items}
                  loading={loading}
                  page={page}
                  totalPages={totalPages}
                  totalFiltered={totalFiltered}
                  onPageChange={setPage}
                  onRowClick={openPanel}
                />
              ),
            },
            {
              id: 'iso',
              label: 'ISOs',
              content: (
                <ContentItemTable
                  items={items}
                  loading={loading}
                  page={page}
                  totalPages={totalPages}
                  totalFiltered={totalFiltered}
                  onPageChange={setPage}
                  onRowClick={openPanel}
                />
              ),
            },
            {
              id: 'script',
              label: 'Scripts',
              content: (
                <ContentItemTable
                  items={items}
                  loading={loading}
                  page={page}
                  totalPages={totalPages}
                  totalFiltered={totalFiltered}
                  onPageChange={setPage}
                  onRowClick={openPanel}
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
      </div>
    </div>
  );
}
