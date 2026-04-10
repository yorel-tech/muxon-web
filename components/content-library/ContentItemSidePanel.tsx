'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { X, Pencil, Trash2, Rocket, Download } from 'lucide-react';
import { Button } from '@/components/ui/atoms/button';
import { Input } from '@/components/ui/atoms/input';
import { Modal } from '@/components/ui/molecules/modal';
import { DetailRow, formatDetailDate } from '@/components/entity-detail/DetailRow';
import type { ContentItemRow } from '@/types/content-library';
import {
  deletePlatformContentItem,
  deleteTenantContentItem,
  downloadPlatformContentItem,
  downloadTenantContentItem,
  updatePlatformContentItem,
  updateTenantContentItem,
} from '@/lib/api/content-library';
import { formatBytes } from '@/lib/format-bytes';

export interface ContentItemSidePanelProps {
  item: ContentItemRow | null;
  isOpen: boolean;
  onClose: () => void;
  scope: 'platform' | 'tenant';
  libraryId: string;
  tenantId?: string | null;
  /** User can mutate items (tenant-owned or platform operator with write). */
  canWrite: boolean;
  showDeployVm?: boolean;
  onRefetch: () => void;
}

export function ContentItemSidePanel({
  item,
  isOpen,
  onClose,
  scope,
  libraryId,
  tenantId,
  canWrite,
  showDeployVm = false,
  onRefetch,
}: ContentItemSidePanelProps) {
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editVersion, setEditVersion] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const openEdit = () => {
    if (!item) return;
    setEditName(item.name ?? '');
    setEditDescription(item.description ?? '');
    setEditVersion(item.version ?? '');
    setError(null);
    setEditOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!item) return;
    setSaving(true);
    setError(null);
    try {
      if (scope === 'platform') {
        await updatePlatformContentItem(libraryId, item.id, {
          name: editName.trim(),
          description: editDescription.trim() || undefined,
          version: editVersion.trim() || undefined,
        });
      } else if (tenantId) {
        await updateTenantContentItem(tenantId, libraryId, item.id, {
          name: editName.trim(),
          description: editDescription.trim() || undefined,
          version: editVersion.trim() || undefined,
        });
      }
      setEditOpen(false);
      onRefetch();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!item) return;
    if (!confirm(`Delete content item "${item.name}"? This cannot be undone.`)) return;
    setDeleting(true);
    try {
      if (scope === 'platform') {
        await deletePlatformContentItem(libraryId, item.id);
      } else if (tenantId) {
        await deleteTenantContentItem(tenantId, libraryId, item.id);
      }
      onClose();
      onRefetch();
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Delete failed');
    } finally {
      setDeleting(false);
    }
  };

  const deployVm = () => {
    if (!item) return;
    const q = new URLSearchParams({
      contentItemId: item.id,
      libraryId,
    });
    router.push(`/tenant/vms?${q.toString()}`);
    onClose();
  };

  const isTemplate = (item?.contentType ?? '').toLowerCase() === 'vm_template';
  const statusLower = (item?.contentStatus ?? '').toLowerCase();
  const canDownloadItem = statusLower === 'available' || statusLower === 'uploading';

  return (
    <>
      <AnimatePresence>
        {isOpen && item && (
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
              className="fixed right-0 top-0 z-50 h-full w-full max-w-md border-l border-panel bg-surface shadow-xl flex flex-col dark:border-gray-700"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'tween', duration: 0.25 }}
            >
              <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 px-4 py-3">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 truncate pr-2">{item.name}</h2>
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded p-1 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto px-4 py-3">
                <DetailRow label="ID" value={item.id} />
                <DetailRow label="Content type" value={item.contentType} />
                <DetailRow label="Version" value={item.version ?? '—'} />
                <DetailRow label="Content status" value={item.contentStatus ?? '—'} />
                <DetailRow label="Size" value={formatBytes(item.sizeBytes)} />
                <DetailRow label="Checksum" value={item.checksum ?? '—'} />
                <DetailRow label="Algorithm" value={item.checksumAlgorithm ?? '—'} />
                <DetailRow label="Provider path" value={item.providerRelativePath ?? '—'} />
                <DetailRow label="Source URL" value={item.sourceUrl ?? '—'} />
                <DetailRow
                  label="Metadata"
                  value={
                    item.metadata && Object.keys(item.metadata).length > 0 ? (
                      <pre className="text-xs whitespace-pre-wrap break-all max-h-40 overflow-auto bg-gray-50 dark:bg-gray-900 p-2 rounded">
                        {JSON.stringify(item.metadata, null, 2)}
                      </pre>
                    ) : (
                      '—'
                    )
                  }
                />
                <DetailRow label="Created" value={formatDetailDate(item.createdAt)} />
                <DetailRow label="Updated" value={formatDetailDate(item.updatedAt)} />
                <DetailRow label="Last replicated" value={formatDetailDate(item.lastReplicatedAt ?? undefined)} />
              </div>
              <div className="border-t border-gray-200 dark:border-gray-700 p-4 flex flex-wrap gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={!canDownloadItem || downloading}
                  onClick={() => {
                    if (!item || !canDownloadItem) return;
                    setDownloading(true);
                    void (async () => {
                      try {
                        const res =
                          scope === 'platform'
                            ? await downloadPlatformContentItem(libraryId, item.id)
                            : tenantId
                              ? await downloadTenantContentItem(tenantId, libraryId, item.id)
                              : null;
                        if (res?.url) window.open(res.url, '_blank', 'noopener,noreferrer');
                      } catch (e) {
                        alert(e instanceof Error ? e.message : 'Download failed');
                      } finally {
                        setDownloading(false);
                      }
                    })();
                  }}
                  title={canDownloadItem ? 'Open download link' : 'Content not available in store yet'}
                >
                  <Download className="h-4 w-4 mr-1" />
                  {downloading ? 'Opening…' : 'Download'}
                </Button>
                {canWrite && (
                  <>
                    <Button variant="secondary" size="sm" onClick={openEdit}>
                      <Pencil className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      className="text-red-600 hover:text-red-700"
                      onClick={() => void handleDelete()}
                      disabled={deleting}
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      {deleting ? 'Deleting…' : 'Delete'}
                    </Button>
                  </>
                )}
                {showDeployVm && isTemplate && (
                  <Button variant="secondary" size="sm" onClick={deployVm}>
                    <Rocket className="h-4 w-4 mr-1" />
                    Deploy as VM
                  </Button>
                )}
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <Modal isOpen={editOpen} onClose={() => setEditOpen(false)} title="Edit content item" size="md">
        <div className="space-y-3">
          {error && (
            <div className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-3 py-2 text-sm text-red-800 dark:text-red-200">
              {error}
            </div>
          )}
          <Input label="Name" value={editName} onChange={(e) => setEditName(e.target.value)} fullWidth />
          <Input
            label="Description"
            value={editDescription}
            onChange={(e) => setEditDescription(e.target.value)}
            fullWidth
          />
          <Input label="Version" value={editVersion} onChange={(e) => setEditVersion(e.target.value)} fullWidth />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setEditOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => void handleSaveEdit()} disabled={saving || !editName.trim()}>
              {saving ? 'Saving…' : 'Save'}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
