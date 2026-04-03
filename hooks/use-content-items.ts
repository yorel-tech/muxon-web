'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ContentItemRow } from '@/types/content-library';
import { fetchAllContentItems } from '@/lib/api/content-library';

export type ContentTypeTab = 'all' | 'vm_template' | 'iso' | 'script';

function matchesTab(item: ContentItemRow, tab: ContentTypeTab): boolean {
  if (tab === 'all') return true;
  const t = (item.contentType ?? '').toLowerCase();
  return t === tab;
}

export interface UseContentItemsOptions {
  libraryId: string;
  scope: 'platform' | 'tenant';
  tenantId?: string | null;
  tab: ContentTypeTab;
  page: number;
  perPage: number;
  enabled?: boolean;
}

export function useContentItems({
  libraryId,
  scope,
  tenantId,
  tab,
  page,
  perPage,
  enabled = true,
}: UseContentItemsOptions) {
  const [allItems, setAllItems] = useState<ContentItemRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    if (!libraryId || !enabled) {
      setAllItems([]);
      setLoading(false);
      return;
    }
    if (scope === 'tenant' && !tenantId) {
      setAllItems([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const items = await fetchAllContentItems(scope, libraryId, tenantId ?? undefined);
      setAllItems(items);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load items');
      setAllItems([]);
    } finally {
      setLoading(false);
    }
  }, [libraryId, scope, tenantId, enabled]);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  const filtered = useMemo(
    () => allItems.filter((item) => matchesTab(item, tab)),
    [allItems, tab],
  );

  const totalFiltered = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalFiltered / perPage));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * perPage;
  const pageItems = filtered.slice(start, start + perPage);

  return {
    items: pageItems,
    loading,
    error,
    totalFiltered,
    totalPages,
    safePage,
    refetch,
  };
}
