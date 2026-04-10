'use client';

import { useCallback, useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/atoms/button';
import { formatBytes } from '@/lib/format-bytes';
import {
  listPlatformContentLibraryDistributionItems,
  listTenantContentLibraryDistributionItems,
  replicatePlatformContentLibraryDistribution,
  replicateTenantContentLibraryDistribution,
  unpublishPlatformContentLibraryDistribution,
  unpublishTenantContentLibraryDistribution,
} from '@/lib/api/content-library';
import type { ContentItemDistributionRow, ContentLibraryDistributionRow } from '@/types/content-library';

export interface DistributionReplicationDrawerProps {
  distribution: ContentLibraryDistributionRow | null;
  isOpen: boolean;
  onClose: () => void;
  scope: 'platform' | 'tenant';
  libraryId: string;
  tenantId?: string | null;
  canWrite: boolean;
  onParentRefresh: () => void;
}

type StatusFilter = 'all' | ContentItemDistributionRow['status'];

function statusBadgeClass(status: string): string {
  switch (status) {
    case 'READY':
      return 'bg-emerald-100 text-emerald-900 dark:bg-emerald-900/40 dark:text-emerald-100';
    case 'FAILED':
      return 'bg-red-100 text-red-900 dark:bg-red-900/40 dark:text-red-100';
    case 'COPYING':
      return 'bg-amber-100 text-amber-900 dark:bg-amber-900/40 dark:text-amber-100';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
  }
}

export function DistributionReplicationDrawer({
  distribution,
  isOpen,
  onClose,
  scope,
  libraryId,
  tenantId,
  canWrite,
  onParentRefresh,
}: DistributionReplicationDrawerProps) {
  const [items, setItems] = useState<ContentItemDistributionRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<StatusFilter>('all');
  const [actionBusy, setActionBusy] = useState(false);

  const loadItems = useCallback(async () => {
    if (!distribution) return;
    setLoading(true);
    setError(null);
    try {
      const res =
        scope === 'platform'
          ? await listPlatformContentLibraryDistributionItems(libraryId, distribution.id, {
              status: filter === 'all' ? undefined : filter,
              page: 1,
              perPage: 200,
            })
          : tenantId
            ? await listTenantContentLibraryDistributionItems(tenantId, libraryId, distribution.id, {
                status: filter === 'all' ? undefined : filter,
                page: 1,
                perPage: 200,
              })
            : { items: [] };
      setItems(res.items ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load distribution items');
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [distribution, scope, libraryId, tenantId, filter]);

  useEffect(() => {
    if (!isOpen || !distribution) return;
    void loadItems();
  }, [isOpen, distribution, loadItems]);

  useEffect(() => {
    if (!isOpen || !distribution) return;
    const replicating = distribution.replicateStatus === 'replicating';
    if (!replicating) return;
    const t = window.setInterval(() => {
      void loadItems();
      onParentRefresh();
    }, 5000);
    return () => window.clearInterval(t);
  }, [isOpen, distribution?.id, distribution?.replicateStatus, loadItems, onParentRefresh]);

  const dcLabel =
    distribution?.datacenter?.name?.trim() ||
    distribution?.datacenterId ||
    'Datacenter';
  const pct = Math.min(100, Math.max(0, distribution?.progressPercent ?? 0));

  const handleReplicate = async () => {
    if (!distribution) return;
    setActionBusy(true);
    try {
      if (scope === 'platform') {
        await replicatePlatformContentLibraryDistribution(libraryId, distribution.id);
      } else if (tenantId) {
        await replicateTenantContentLibraryDistribution(tenantId, libraryId, distribution.id);
      }
      onParentRefresh();
      await loadItems();
    } finally {
      setActionBusy(false);
    }
  };

  const handleUnpublish = async () => {
    if (!distribution) return;
    setActionBusy(true);
    try {
      if (scope === 'platform') {
        await unpublishPlatformContentLibraryDistribution(libraryId, distribution.id);
      } else if (tenantId) {
        await unpublishTenantContentLibraryDistribution(tenantId, libraryId, distribution.id);
      }
      onParentRefresh();
      onClose();
    } finally {
      setActionBusy(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && distribution && (
        <>
          <motion.button
            type="button"
            aria-label="Close panel"
            className="fixed inset-0 z-40 bg-black/50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.aside
            role="dialog"
            aria-modal="true"
            className="fixed right-0 top-0 z-50 flex h-full w-full max-w-lg flex-col border-l border-panel bg-surface shadow-xl dark:border-gray-700"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'tween', duration: 0.25 }}
          >
            <div className="flex items-start justify-between border-b border-gray-200 px-4 py-3 dark:border-gray-700">
              <div className="min-w-0 pr-2">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{dcLabel}</h2>
                <p className="mt-0.5 font-mono text-xs text-gray-500 dark:text-gray-400">
                  {distribution.datacenterId}
                </p>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                  Status: <span className="font-medium">{distribution.replicateStatus}</span>
                  {distribution.storageClassName ? (
                    <span className="ml-2 text-gray-500">· {distribution.storageClassName}</span>
                  ) : null}
                </p>
                <div className="mt-2 h-2 w-full overflow-hidden rounded bg-gray-200 dark:bg-gray-700">
                  <div
                    className="h-full bg-blue-600 transition-all dark:bg-blue-500"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500">{pct}%</p>
                {distribution.errorMessage ? (
                  <p className="mt-2 rounded border border-red-200 bg-red-50 px-2 py-1 text-xs text-red-800 dark:border-red-800 dark:bg-red-900/20 dark:text-red-200">
                    {distribution.errorMessage}
                  </p>
                ) : null}
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded p-1 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {canWrite && (
              <div className="flex flex-wrap gap-2 border-b border-gray-200 px-4 py-3 dark:border-gray-700">
                <Button size="sm" variant="secondary" disabled={actionBusy} onClick={() => void handleReplicate()}>
                  Replicate
                </Button>
                <Button size="sm" variant="secondary" disabled={actionBusy} onClick={() => void handleUnpublish()}>
                  Unpublish
                </Button>
              </div>
            )}

            <div className="border-b border-gray-200 px-4 py-2 dark:border-gray-700">
              <div className="flex flex-wrap gap-1 text-xs">
                {(['all', 'PENDING', 'COPYING', 'READY', 'FAILED'] as const).map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setFilter(f)}
                    className={`rounded px-2 py-1 ${
                      filter === f
                        ? 'bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-200'
                    }`}
                  >
                    {f === 'all' ? 'All' : f}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-3">
              {error && (
                <p className="mb-2 text-sm text-red-600 dark:text-red-400">{error}</p>
              )}
              {loading && items.length === 0 ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                </div>
              ) : items.length === 0 ? (
                <p className="text-sm text-gray-500">No rows for this filter (replicate to seed per-item status).</p>
              ) : (
                <ul className="divide-y divide-panel text-sm">
                  {items.map((row) => (
                    <li key={row.id} className="py-2">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-gray-900 dark:text-gray-100">{row.name ?? row.contentItemId}</p>
                          <p className="text-xs text-gray-500">{row.contentType ?? '—'}</p>
                        </div>
                        <span
                          className={`shrink-0 rounded px-2 py-0.5 text-xs font-medium ${statusBadgeClass(row.status)}`}
                        >
                          {row.status}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
                        {row.sizeBytes != null ? formatBytes(row.sizeBytes) : '—'}
                        {row.checksumVerified ? ' · checksum ok' : ''}
                      </p>
                      {row.errorMessage ? (
                        <p className="mt-1 text-xs text-red-600 dark:text-red-400">{row.errorMessage}</p>
                      ) : null}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
