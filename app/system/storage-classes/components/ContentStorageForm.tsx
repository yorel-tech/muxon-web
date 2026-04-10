'use client';

import { useEffect, useState } from 'react';
import { Modal } from '@/components/ui/molecules/modal';
import { Button } from '@/components/ui/atoms/button';
import { Input } from '@/components/ui/atoms/input';
import { Checkbox } from '@/components/ui/atoms/checkbox';
import type { ContentStorageRow, ContentStorageTypeApi } from '@/types/content-storage';
import { useCreateContentStorage, useUpdateContentStorage } from '../hooks/useContentStorages';

export const DEFAULT_CONTENT_STORAGE_LOCAL_PATH = '/var/lib/infron/content-libraries';

interface ContentStorageFormProps {
  storage: ContentStorageRow | null;
  onClose: () => void;
}

export default function ContentStorageForm({ storage, onClose }: ContentStorageFormProps) {
  const isEdit = Boolean(storage);
  const createMutation = useCreateContentStorage();
  const updateMutation = useUpdateContentStorage();

  const [name, setName] = useState('');
  const [type, setType] = useState<ContentStorageTypeApi>('local');
  const [isDefault, setIsDefault] = useState(false);

  const [path, setPath] = useState(DEFAULT_CONTENT_STORAGE_LOCAL_PATH);
  const [mountPath, setMountPath] = useState('');
  const [nfsServer, setNfsServer] = useState('');
  const [nfsExport, setNfsExport] = useState('');

  const [s3Bucket, setS3Bucket] = useState('');
  const [s3Region, setS3Region] = useState('');
  const [s3Prefix, setS3Prefix] = useState('');
  const [s3Endpoint, setS3Endpoint] = useState('');
  const [s3AccessKeyId, setS3AccessKeyId] = useState('');
  const [s3SecretAccessKey, setS3SecretAccessKey] = useState('');

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setError(null);
    if (storage) {
      setName(storage.name ?? '');
      setType(storage.type);
      setIsDefault(Boolean(storage.isDefault));
      const c = storage.config ?? {};
      setPath((c.path as string) ?? DEFAULT_CONTENT_STORAGE_LOCAL_PATH);
      setMountPath((c.mountPath as string) ?? '');
      setNfsServer((c.server as string) ?? '');
      setNfsExport((c.export as string) ?? '');
      setS3Bucket((c.bucket as string) ?? '');
      setS3Region((c.region as string) ?? '');
      setS3Prefix((c.prefix as string) ?? '');
      setS3Endpoint((c.endpoint as string) ?? '');
      setS3AccessKeyId((c.accessKeyId as string) ?? '');
      setS3SecretAccessKey((c.secretAccessKey as string) ?? '');
    } else {
      setName('');
      setType('local');
      setIsDefault(false);
      setPath(DEFAULT_CONTENT_STORAGE_LOCAL_PATH);
      setMountPath('');
      setNfsServer('');
      setNfsExport('');
      setS3Bucket('');
      setS3Region('');
      setS3Prefix('');
      setS3Endpoint('');
      setS3AccessKeyId('');
      setS3SecretAccessKey('');
    }
  }, [storage]);

  const buildConfig = (): Record<string, unknown> => {
    switch (type) {
      case 'local':
        return { path: path.trim() };
      case 'nfs': {
        const o: Record<string, unknown> = { mountPath: mountPath.trim() };
        if (nfsServer.trim()) o.server = nfsServer.trim();
        if (nfsExport.trim()) o.export = nfsExport.trim();
        return o;
      }
      case 's3': {
        const o: Record<string, unknown> = {
          bucket: s3Bucket.trim(),
          region: s3Region.trim(),
        };
        if (s3Prefix.trim()) o.prefix = s3Prefix.trim();
        if (s3Endpoint.trim()) o.endpoint = s3Endpoint.trim();
        if (s3AccessKeyId.trim()) o.accessKeyId = s3AccessKeyId.trim();
        if (s3SecretAccessKey.trim()) o.secretAccessKey = s3SecretAccessKey.trim();
        return o;
      }
      default:
        return {};
    }
  };

  const handleSubmit = async () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError('Name is required.');
      return;
    }
    if (type === 'nfs' && !mountPath.trim()) {
      setError('NFS mount path is required.');
      return;
    }
    if (type === 's3') {
      if (!s3Bucket.trim() || !s3Region.trim()) {
        setError('S3 bucket and region are required.');
        return;
      }
    }

    setError(null);
    const config = buildConfig();

    try {
      if (isEdit && storage) {
        await updateMutation.mutateAsync({
          id: storage.id,
          body: {
            name: trimmedName,
            config,
            ...(isDefault !== storage.isDefault ? { isDefault } : {}),
          },
        });
      } else {
        await createMutation.mutateAsync({
          name: trimmedName,
          type,
          config,
          isDefault: isDefault || undefined,
        });
      }
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Request failed');
    }
  };

  const busy = createMutation.isPending || updateMutation.isPending;

  const selectClass =
    'w-full rounded-md border border-panel bg-surface px-4 py-2 text-gray-900 dark:text-gray-100';

  return (
    <Modal
      isOpen
      onClose={() => {
        if (!busy) onClose();
      }}
      title={isEdit ? 'Edit content storage' : 'Create content storage'}
      size="md"
    >
      <div className="space-y-4">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Where content library uploads are stored (local disk, NFS mount, or S3-compatible object storage).
        </p>
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-800 dark:bg-red-900/20 dark:text-red-200">
            {error}
          </div>
        )}

        <Input label="Name" value={name} onChange={(e) => setName(e.target.value)} fullWidth required />

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300" htmlFor="cs-type">
            Type
          </label>
          <select
            id="cs-type"
            className={selectClass}
            value={type}
            onChange={(e) => setType(e.target.value as ContentStorageTypeApi)}
            disabled={isEdit}
          >
            <option value="local">Local filesystem</option>
            <option value="nfs">NFS (mounted path)</option>
            <option value="s3">S3 / object storage</option>
          </select>
          {isEdit && (
            <p className="mt-1 text-xs text-gray-500">Type cannot be changed after creation.</p>
          )}
        </div>

        {type === 'local' && (
          <Input
            label="Root path"
            value={path}
            onChange={(e) => setPath(e.target.value)}
            fullWidth
            placeholder={DEFAULT_CONTENT_STORAGE_LOCAL_PATH}
          />
        )}

        {type === 'nfs' && (
          <div className="space-y-3">
            <Input
              label="Mount path (on core-services host)"
              value={mountPath}
              onChange={(e) => setMountPath(e.target.value)}
              fullWidth
              required
            />
            <Input label="Server (informational)" value={nfsServer} onChange={(e) => setNfsServer(e.target.value)} fullWidth />
            <Input label="Export (informational)" value={nfsExport} onChange={(e) => setNfsExport(e.target.value)} fullWidth />
          </div>
        )}

        {type === 's3' && (
          <div className="space-y-3">
            <Input label="Bucket" value={s3Bucket} onChange={(e) => setS3Bucket(e.target.value)} fullWidth required />
            <Input label="Region" value={s3Region} onChange={(e) => setS3Region(e.target.value)} fullWidth required />
            <Input
              label="Key prefix (optional)"
              value={s3Prefix}
              onChange={(e) => setS3Prefix(e.target.value)}
              fullWidth
            />
            <Input
              label="Custom endpoint (optional, e.g. MinIO)"
              value={s3Endpoint}
              onChange={(e) => setS3Endpoint(e.target.value)}
              fullWidth
            />
            <Input
              label="Access key ID (optional)"
              value={s3AccessKeyId}
              onChange={(e) => setS3AccessKeyId(e.target.value)}
              fullWidth
            />
            <Input
              label="Secret access key (optional)"
              type="password"
              value={s3SecretAccessKey}
              onChange={(e) => setS3SecretAccessKey(e.target.value)}
              fullWidth
            />
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Omit access key and secret to use the default AWS credential provider chain on the host.
            </p>
          </div>
        )}

        <Checkbox
          checked={isDefault}
          onChange={(e) => setIsDefault(e.target.checked)}
          label="Set as default content storage"
        />

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="secondary" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button onClick={() => void handleSubmit()} disabled={busy}>
            {busy ? 'Saving…' : isEdit ? 'Save' : 'Create'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
