'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Modal } from '@/components/ui/molecules/modal';
import { Button } from '@/components/ui/atoms/button';
import { Input } from '@/components/ui/atoms/input';
import { Textarea } from '@/components/ui/atoms/textarea';
import { createTenantContentLibrary } from '@/lib/api/content-library';

export interface CreateTenantContentLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  tenantId: string;
}

export function CreateTenantContentLibraryModal({
  isOpen,
  onClose,
  tenantId,
}: CreateTenantContentLibraryModalProps) {
  const router = useRouter();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setName('');
    setDescription('');
    setError(null);
    setSubmitting(false);
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
    if (!tenantId) {
      setError('Missing tenant.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const created = await createTenantContentLibrary(tenantId, {
        name: trimmed,
        type: 'local',
        description: description.trim() || undefined,
      });
      onClose();
      router.push(`/tenant/content-libraries/${created.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create library');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Create content library" size="md">
      <div className="space-y-4">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Files you upload are stored in the platform default content storage. Tenant libraries are always local;
          publish to datacenters from the detail page when needed.
        </p>
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-800 dark:bg-red-900/20 dark:text-red-200">
            {error}
          </div>
        )}
        <Input label="Name" value={name} onChange={(e) => setName(e.target.value)} fullWidth required />
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
          <Button onClick={() => void handleSubmit()} disabled={submitting || !name.trim()}>
            {submitting ? 'Creating…' : 'Create'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
