'use client';

import { useEffect, useState } from 'react';
import { Modal } from '@/components/ui/molecules/modal';
import { Button } from '@/components/ui/atoms/button';
import {
  fetchDatacenterOptions,
  fetchTenantDatacenterGrants,
  grantDatacenterId,
  type TenantDatacenterGrantBrief,
} from '@/lib/content-library-placement';
import {
  fetchStorageClassesForContentPublish,
  publishPlatformContentLibrary,
  publishTenantContentLibrary,
} from '@/lib/api/content-library';

export interface PublishToDatacenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  scope: 'platform' | 'tenant';
  tenantId: string | null | undefined;
  libraryId: string;
  onPublished: () => void;
}

export function PublishToDatacenterModal({
  isOpen,
  onClose,
  scope,
  tenantId,
  libraryId,
  onPublished,
}: PublishToDatacenterModalProps) {
  const [datacenterId, setDatacenterId] = useState('');
  const [storageClassName, setStorageClassName] = useState('');
  const [options, setOptions] = useState<{ id: string; name: string }[]>([]);
  const [storageClasses, setStorageClasses] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [classesLoading, setClassesLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setDatacenterId('');
    setStorageClassName('');
    setStorageClasses([]);
    setError(null);
    setSubmitting(false);
    setLoading(true);
    void (async () => {
      try {
        if (scope === 'platform') {
          setOptions(await fetchDatacenterOptions());
        } else if (tenantId) {
          const grants = await fetchTenantDatacenterGrants(tenantId);
          const opts: { id: string; name: string }[] = [];
          for (const g of grants as TenantDatacenterGrantBrief[]) {
            const id = grantDatacenterId(g);
            if (id) opts.push({ id, name: g.datacenter?.name ?? id });
          }
          setOptions(opts);
        } else {
          setOptions([]);
        }
      } catch {
        setOptions([]);
        setError('Could not load datacenters.');
      } finally {
        setLoading(false);
      }
    })();
  }, [isOpen, scope, tenantId]);

  useEffect(() => {
    if (!isOpen || !datacenterId) {
      setStorageClasses([]);
      setStorageClassName('');
      return;
    }
    setClassesLoading(true);
    setError(null);
    void (async () => {
      try {
        const names = await fetchStorageClassesForContentPublish(
          scope,
          datacenterId,
          tenantId ?? undefined,
        );
        setStorageClasses(names);
        setStorageClassName((prev) => (prev && names.includes(prev) ? prev : names[0] ?? ''));
      } catch {
        setStorageClasses([]);
        setStorageClassName('');
        setError('Could not load storage classes for this datacenter.');
      } finally {
        setClassesLoading(false);
      }
    })();
  }, [isOpen, scope, tenantId, datacenterId]);

  const handleClose = () => {
    if (submitting) return;
    onClose();
  };

  const handleSubmit = async () => {
    if (!datacenterId) {
      setError('Select a datacenter.');
      return;
    }
    if (!storageClassName) {
      setError('Select a storage class.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      if (scope === 'platform') {
        await publishPlatformContentLibrary(libraryId, { datacenterId, storageClassName });
      } else {
        if (!tenantId) throw new Error('Missing tenant');
        await publishTenantContentLibrary(tenantId, libraryId, { datacenterId, storageClassName });
      }
      onPublished();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Publish failed');
    } finally {
      setSubmitting(false);
    }
  };

  const selectClass =
    'w-full rounded-md border border-panel bg-surface px-4 py-2 text-gray-900 dark:text-gray-100';

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Publish to datacenter" size="sm">
      <div className="space-y-4">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Choose the datacenter and which of its storage classes should receive replicated artifacts (same paths as
          content storage under each matching provider pool).
        </p>
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-800 dark:bg-red-900/20 dark:text-red-200">
            {error}
          </div>
        )}
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300" htmlFor="pub-dc">
            Datacenter
          </label>
          <select
            id="pub-dc"
            className={selectClass}
            value={datacenterId}
            onChange={(e) => setDatacenterId(e.target.value)}
            disabled={loading}
          >
            <option value="">{loading ? 'Loading…' : 'Select datacenter'}</option>
            {options.map((dc) => (
              <option key={dc.id} value={dc.id}>
                {dc.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300" htmlFor="pub-sc">
            Storage class
          </label>
          <select
            id="pub-sc"
            className={selectClass}
            value={storageClassName}
            onChange={(e) => setStorageClassName(e.target.value)}
            disabled={!datacenterId || classesLoading}
          >
            <option value="">
              {!datacenterId ? 'Select datacenter first' : classesLoading ? 'Loading…' : 'Select storage class'}
            </option>
            {storageClasses.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="secondary" onClick={handleClose} disabled={submitting}>
            Cancel
          </Button>
          <Button
            onClick={() => void handleSubmit()}
            disabled={submitting || !datacenterId || !storageClassName}
          >
            {submitting ? 'Publishing…' : 'Publish'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
