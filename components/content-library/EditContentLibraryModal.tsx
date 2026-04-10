'use client';

import { useEffect, useState } from 'react';
import { Modal } from '@/components/ui/molecules/modal';
import { Button } from '@/components/ui/atoms/button';
import { Input } from '@/components/ui/atoms/input';
import { Textarea } from '@/components/ui/atoms/textarea';
import { updatePlatformContentLibrary, updateTenantContentLibrary } from '@/lib/api/content-library';
import { listContentStorages } from '@/lib/api/content-storage';
import type { ContentLibraryRow } from '@/types/content-library';
import type { ContentStorageRow } from '@/types/content-storage';

export interface EditContentLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  scope: 'platform' | 'tenant';
  tenantId: string | null | undefined;
  library: ContentLibraryRow | null;
  onSaved: (row: ContentLibraryRow) => void;
}

export function EditContentLibraryModal({
  isOpen,
  onClose,
  scope,
  tenantId,
  library,
  onSaved,
}: EditContentLibraryModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [contentStorages, setContentStorages] = useState<ContentStorageRow[]>([]);
  const [contentStorageId, setContentStorageId] = useState('');
  const [csLoading, setCsLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !library) return;
    setName(library.name ?? '');
    setDescription(library.description ?? '');
    setContentStorageId(library.contentStorageId ?? '');
    setError(null);
    setSubmitting(false);
  }, [isOpen, library]);

  useEffect(() => {
    if (!isOpen || scope !== 'platform') return;
    setCsLoading(true);
    void (async () => {
      try {
        const res = await listContentStorages(1, 200);
        setContentStorages(res.items ?? []);
      } catch {
        setContentStorages([]);
        setError('Could not load content storages.');
      } finally {
        setCsLoading(false);
      }
    })();
  }, [isOpen, scope]);

  const handleClose = () => {
    if (submitting) return;
    onClose();
  };

  const handleSubmit = async () => {
    if (!library) return;
    const trimmed = name.trim();
    if (!trimmed) {
      setError('Name is required.');
      return;
    }
    if (scope === 'platform' && !contentStorageId.trim()) {
      setError('Content storage is required.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const body =
        scope === 'platform'
          ? {
              name: trimmed,
              description: description.trim() || undefined,
              contentStorageId: contentStorageId.trim(),
            }
          : {
              name: trimmed,
              description: description.trim() || undefined,
            };
      const row =
        scope === 'platform'
          ? await updatePlatformContentLibrary(library.id, body)
          : await updateTenantContentLibrary(tenantId!, library.id, body);
      onSaved(row);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to update library');
    } finally {
      setSubmitting(false);
    }
  };

  if (!library) return null;

  const selectClass =
    'w-full rounded-md border border-panel bg-surface px-4 py-2 text-gray-900 dark:text-gray-100';

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Edit content library" size="md">
      <div className="space-y-4">
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-800 dark:bg-red-900/20 dark:text-red-200">
            {error}
          </div>
        )}
        <Input label="Name" value={name} onChange={(e) => setName(e.target.value)} fullWidth required />
        {scope === 'tenant' && (
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Uploads use the platform default content storage (tenant libraries cannot pick a different store).
          </p>
        )}
        {scope === 'platform' && (
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300" htmlFor="ed-cs">
              Content storage
            </label>
            <select
              id="ed-cs"
              className={selectClass}
              value={contentStorageId}
              onChange={(e) => setContentStorageId(e.target.value)}
              disabled={csLoading}
            >
              <option value="">{csLoading ? 'Loading…' : 'Select content storage'}</option>
              {contentStorages.map((cs) => (
                <option key={cs.id} value={cs.id}>
                  {cs.name}
                  {cs.isDefault ? ' (default)' : ''} — {cs.type}
                </option>
              ))}
            </select>
          </div>
        )}
        <Textarea
          label="Description (optional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
        />
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="secondary" onClick={handleClose} disabled={submitting}>
            Cancel
          </Button>
          <Button
            onClick={() => void handleSubmit()}
            disabled={submitting || !name.trim() || (scope === 'platform' && !contentStorageId.trim())}
          >
            {submitting ? 'Saving…' : 'Save'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
