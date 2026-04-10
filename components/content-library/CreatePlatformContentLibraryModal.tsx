'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Modal } from '@/components/ui/molecules/modal';
import { Button } from '@/components/ui/atoms/button';
import { Input } from '@/components/ui/atoms/input';
import { Textarea } from '@/components/ui/atoms/textarea';
import { createPlatformContentLibrary } from '@/lib/api/content-library';
import { listContentStorages } from '@/lib/api/content-storage';
import type { ContentLibraryTypeApi } from '@/types/content-library';
import type { ContentStorageRow } from '@/types/content-storage';

export interface CreatePlatformContentLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreatePlatformContentLibraryModal({ isOpen, onClose }: CreatePlatformContentLibraryModalProps) {
  const router = useRouter();
  const [name, setName] = useState('');
  const [type, setType] = useState<ContentLibraryTypeApi>('local');
  const [description, setDescription] = useState('');
  const [contentStorages, setContentStorages] = useState<ContentStorageRow[]>([]);
  const [contentStorageId, setContentStorageId] = useState('');
  const [csLoading, setCsLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setName('');
    setType('local');
    setDescription('');
    setContentStorageId('');
    setError(null);
    setSubmitting(false);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    setCsLoading(true);
    void (async () => {
      try {
        const res = await listContentStorages(1, 200);
        const items = res.items ?? [];
        setContentStorages(items);
        const def = items.find((s) => s.isDefault);
        if (def) setContentStorageId(def.id);
        else if (items[0]) setContentStorageId(items[0].id);
      } catch {
        setContentStorages([]);
        setError('Could not load content storages.');
      } finally {
        setCsLoading(false);
      }
    })();
  }, [isOpen]);

  const handleClose = () => {
    if (submitting) return;
    onClose();
  };

  const handleSubmit = async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setError('Name is required.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const created = await createPlatformContentLibrary({
        name: trimmed,
        type,
        description: description.trim() || undefined,
        contentStorageId: contentStorageId.trim(),
      });
      onClose();
      router.push(`/system/content-libraries/${created.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create library');
    } finally {
      setSubmitting(false);
    }
  };

  const selectClass =
    'w-full rounded-md border border-panel bg-surface px-4 py-2 text-gray-900 dark:text-gray-100';

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Create content library" size="md">
      <div className="space-y-4">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Pick the content storage where uploads are written. Publish to datacenters after creation from the library
          detail page.
        </p>
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-800 dark:bg-red-900/20 dark:text-red-200">
            {error}
          </div>
        )}
        <Input label="Name" value={name} onChange={(e) => setName(e.target.value)} fullWidth required />
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300" htmlFor="cl-type">
            Type
          </label>
          <select
            id="cl-type"
            className={selectClass}
            value={type}
            onChange={(e) => setType(e.target.value as ContentLibraryTypeApi)}
          >
            <option value="local">Local</option>
            <option value="remote">Remote</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300" htmlFor="cl-cs">
            Content storage
          </label>
          <select
            id="cl-cs"
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
          <Button onClick={() => void handleSubmit()} disabled={submitting || !name.trim() || !contentStorageId.trim()}>
            {submitting ? 'Creating…' : 'Create'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
