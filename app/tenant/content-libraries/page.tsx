'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/atoms/card';
import { Table, Column } from '@/components/ui/organisms/table';
import { Badge } from '@/components/ui/atoms/badge';
import { fetchTenantContentLibraries } from '@/lib/api/content-library';
import type { ContentLibraryRow } from '@/types/content-library';
import { formatDetailDate } from '@/components/entity-detail/DetailRow';
import { useTenantId } from '@/lib/use-tenant-id';

export default function TenantContentLibrariesPage() {
  const { tenantId } = useTenantId();
  const [libraries, setLibraries] = useState<ContentLibraryRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!tenantId) {
      setLibraries([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await fetchTenantContentLibraries(tenantId, 1, 200);
      setLibraries(data.items ?? []);
    } catch {
      setLibraries([]);
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  useEffect(() => {
    void load();
  }, [load]);

  const columns: Column<ContentLibraryRow>[] = [
    {
      key: 'name',
      header: 'Name',
      cell: (row) => (
        <Link
          href={`/tenant/content-libraries/${row.id}`}
          className="font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
        >
          {row.name}
        </Link>
      ),
      sortable: true,
    },
    {
      key: 'scope',
      header: 'Scope',
      cell: (row) => {
        const owned = tenantId && row.tenantId === tenantId;
        return (
          <Badge variant={owned ? 'success' : 'secondary'}>
            {owned ? 'Your library' : 'Provider (read-only)'}
          </Badge>
        );
      },
      sortable: false,
    },
    {
      key: 'description',
      header: 'Description',
      cell: (row) => (
        <span className="text-gray-600 dark:text-gray-400 text-sm line-clamp-2">{row.description ?? '—'}</span>
      ),
      sortable: false,
    },
    {
      key: 'type',
      header: 'Type',
      cell: (row) => <Badge variant="secondary">{row.type ?? '—'}</Badge>,
      sortable: true,
    },
    {
      key: 'accessMode',
      header: 'Access',
      cell: (row) => (
        <span className="text-sm text-gray-600 dark:text-gray-400">{row.accessMode ?? '—'}</span>
      ),
      sortable: true,
    },
    {
      key: 'syncStatus',
      header: 'Sync',
      cell: (row) => (
        <Badge variant={row.syncStatus === 'synced' ? 'success' : row.syncStatus === 'failed' ? 'error' : 'default'}>
          {row.syncStatus ?? '—'}
        </Badge>
      ),
      sortable: true,
    },
    {
      key: 'lastSyncedAt',
      header: 'Last synced',
      cell: (row) => (
        <span className="text-sm text-gray-500 dark:text-gray-400">{formatDetailDate(row.lastSyncedAt)}</span>
      ),
      sortable: true,
    },
  ];

  return (
    <div className="min-h-screen bg-app">
      <div className="max-w-full px-3 py-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Content Libraries</h1>
          <p className="mt-1 text-gray-600 dark:text-gray-400 text-sm">
            Libraries shared by your provider and your tenant-owned libraries.
          </p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card>
            <CardContent className="p-0">
              {!tenantId ? (
                <p className="p-6 text-sm text-gray-500">Select a tenant to view content libraries.</p>
              ) : loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                </div>
              ) : (
                <Table
                  columns={columns}
                  data={libraries}
                  emptyMessage="No content libraries available."
                  overflowVisibleColumnKeys={[]}
                />
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
