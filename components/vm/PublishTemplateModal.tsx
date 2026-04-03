'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import { Modal } from '@/components/ui/molecules/modal';
import { Button } from '@/components/ui/atoms/button';
import { Input } from '@/components/ui/atoms/input';
import { Textarea } from '@/components/ui/atoms/textarea';
import { fetchTenantContentLibraries } from '@/lib/api/content-library';
import { publishVmAsTemplate } from '@/lib/api/vm';
import type { ContentLibraryRow } from '@/types/content-library';

export interface PublishTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  tenantId: string;
  vmId: string;
  vmName: string;
  onSuccess: () => void;
}

export function PublishTemplateModal({
  isOpen,
  onClose,
  tenantId,
  vmId,
  vmName,
  onSuccess,
}: PublishTemplateModalProps) {
  const [libraries, setLibraries] = useState<ContentLibraryRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [libraryId, setLibraryId] = useState('');
  const [templateName, setTemplateName] = useState('');
  const [description, setDescription] = useState('');
  const [versionLabel, setVersionLabel] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ contentItemId?: string; libraryId: string } | null>(null);

  const ownedLibraries = useMemo(
    () => libraries.filter((l) => l.tenantId === tenantId),
    [libraries, tenantId],
  );

  const load = useCallback(async () => {
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
    if (!isOpen) return;
    setTemplateName(vmName ? `${vmName}-template` : '');
    setDescription('');
    setVersionLabel('');
    setLibraryId('');
    setError(null);
    setResult(null);
    void load();
  }, [isOpen, vmName, load]);

  const handleClose = () => {
    setResult(null);
    onClose();
  };

  const handleSubmit = async () => {
    if (!libraryId || !templateName.trim()) {
      setError('Library and template name are required.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await publishVmAsTemplate(tenantId, vmId, {
        library_id: libraryId,
        template_name: templateName.trim(),
        description: description.trim() || undefined,
        version_label: versionLabel.trim() || undefined,
      });
      setResult({
        contentItemId: res.content_item_id ?? res.contentItemId,
        libraryId,
      });
      onSuccess();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Publish failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={`Publish as template — ${vmName}`} size="md">
      <div className="space-y-4">
        {result ? (
          <div className="space-y-3">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Template publishing was accepted. {result.contentItemId && `Content item: ${result.contentItemId}`}
            </p>
            <Link
              href={`/tenant/content-libraries/${result.libraryId}`}
              className="text-sm text-primary-600 hover:underline"
            >
              Open content library
            </Link>
            <div className="flex justify-end">
              <Button onClick={handleClose}>Close</Button>
            </div>
          </div>
        ) : loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        ) : (
          <>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Publishes a copy of this VM as a template into a tenant-owned content library.
            </p>
            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 dark:bg-red-900/20 px-3 py-2 text-sm text-red-800 dark:text-red-200">
                {error}
              </div>
            )}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Target library
              </label>
              <select
                className="w-full rounded-md border border-panel bg-surface px-4 py-2 text-gray-900 dark:text-gray-100"
                value={libraryId}
                onChange={(e) => setLibraryId(e.target.value)}
              >
                <option value="">Select library</option>
                {ownedLibraries.map((lib) => (
                  <option key={lib.id} value={lib.id}>
                    {lib.name}
                  </option>
                ))}
              </select>
              {ownedLibraries.length === 0 && (
                <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">
                  No tenant-owned libraries. Create one in the tenant portal first.
                </p>
              )}
            </div>
            <Input
              label="Template name"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              fullWidth
            />
            <Textarea
              label="Description (optional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
            <Input
              label="Version label (optional)"
              value={versionLabel}
              onChange={(e) => setVersionLabel(e.target.value)}
              fullWidth
            />
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="secondary" onClick={handleClose}>
                Cancel
              </Button>
              <Button onClick={() => void handleSubmit()} disabled={submitting || !libraryId || !templateName.trim()}>
                {submitting ? 'Publishing…' : 'Publish'}
              </Button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}
