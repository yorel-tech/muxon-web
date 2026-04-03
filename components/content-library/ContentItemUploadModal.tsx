'use client';

import { useState, useRef } from 'react';
import { Modal } from '@/components/ui/molecules/modal';
import { Button } from '@/components/ui/atoms/button';
import { Input } from '@/components/ui/atoms/input';
import { DragDropZone } from '@/components/content-library/DragDropZone';
import { UploadProgressBar } from '@/components/content-library/UploadProgressBar';
import { calculateFileSha256 } from '@/lib/checksum';
import {
  createPlatformContentItem,
  createTenantContentItem,
} from '@/lib/api/content-library';
import { initiateUploadSession, uploadFileInChunks } from '@/lib/chunked-upload';
import type { ContentTypeApi } from '@/types/content-library';

const MAX_BYTES = 50 * 1024 * 1024 * 1024; // 50 GiB

const CONTENT_TYPES: { value: ContentTypeApi; label: string }[] = [
  { value: 'vm_template', label: 'VM template' },
  { value: 'iso', label: 'ISO' },
  { value: 'script', label: 'Script' },
];

function acceptForType(t: ContentTypeApi): string {
  switch (t) {
    case 'iso':
      return '.iso';
    case 'script':
      return '.sh,.yaml,.yml,.ps1,.txt';
    case 'vm_template':
    default:
      return '.qcow2,.raw,.img,.ova,.vmdk';
  }
}

export interface ContentItemUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  libraryId: string;
  scope: 'platform' | 'tenant';
  tenantId?: string | null;
  onUploaded: () => void;
}

type Step = 'form' | 'hashing' | 'uploading' | 'done' | 'error';

export function ContentItemUploadModal({
  isOpen,
  onClose,
  libraryId,
  scope,
  tenantId,
  onUploaded,
}: ContentItemUploadModalProps) {
  const [step, setStep] = useState<Step>('form');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [version, setVersion] = useState('');
  const [contentType, setContentType] = useState<ContentTypeApi>('vm_template');
  const [file, setFile] = useState<File | null>(null);
  const [uploadedBytes, setUploadedBytes] = useState(0);
  const [totalSize, setTotalSize] = useState(0);
  const [phaseLabel, setPhaseLabel] = useState('');
  const [message, setMessage] = useState<string | undefined>();
  const [error, setError] = useState<string | null>(null);
  const [createdItemId, setCreatedItemId] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const reset = () => {
    setStep('form');
    setName('');
    setDescription('');
    setVersion('');
    setContentType('vm_template');
    setFile(null);
    setUploadedBytes(0);
    setTotalSize(0);
    setPhaseLabel('');
    setMessage(undefined);
    setError(null);
    setCreatedItemId(null);
    abortRef.current = null;
  };

  const handleClose = () => {
    abortRef.current?.abort();
    reset();
    onClose();
  };

  const startUpload = async () => {
    setError(null);
    if (!file || !name.trim()) {
      setError('Name and file are required.');
      return;
    }
    if (scope === 'tenant' && !tenantId) {
      setError('Tenant context missing.');
      return;
    }

    abortRef.current = new AbortController();
    const signal = abortRef.current.signal;

    try {
      const item =
        scope === 'platform'
          ? await createPlatformContentItem(libraryId, {
              name: name.trim(),
              description: description.trim() || undefined,
              version: version.trim() || undefined,
              contentType,
            })
          : await createTenantContentItem(tenantId!, libraryId, {
              name: name.trim(),
              description: description.trim() || undefined,
              version: version.trim() || undefined,
              contentType,
            });

      const itemId = item.id;
      setCreatedItemId(itemId);
      setTotalSize(file.size);

      setStep('hashing');
      setPhaseLabel('Computing checksum');
      setMessage('SHA-256…');

      const checksum = await calculateFileSha256(file);
      if (signal.aborted) return;

      setStep('uploading');
      setUploadedBytes(0);
      setPhaseLabel('Starting upload');
      setMessage(undefined);

      try {
        const session = await initiateUploadSession(
          scope,
          libraryId,
          itemId,
          {
            totalSize: file.size,
            checksumAlgorithm: 'sha256',
            expectedChecksum: checksum,
            chunkSizeHint: 64 * 1024 * 1024,
          },
          tenantId ?? undefined,
        );

        const uploadId = session.id;
        await uploadFileInChunks({
          scope,
          libraryId,
          itemId,
          uploadId,
          file,
          totalSize: file.size,
          signal,
          tenantId: tenantId ?? undefined,
          onProgress: (p) => {
            setUploadedBytes(p.uploadedBytes);
            setTotalSize(p.totalSize);
            setPhaseLabel(
              p.phase === 'completing' ? 'Finalizing' : p.phase === 'done' ? 'Complete' : 'Uploading',
            );
            setMessage(p.message);
          },
        });
      } catch (uploadErr: unknown) {
        const msg = uploadErr instanceof Error ? uploadErr.message : String(uploadErr);
        if (msg.includes('404') || msg.includes('Not Found')) {
          setStep('done');
          setError(null);
          setMessage(
            'Content item metadata was created. Binary upload is not available on this server yet (upload API not deployed).',
          );
          onUploaded();
          return;
        }
        throw uploadErr;
      }

      if (signal.aborted) return;
      setStep('done');
      setPhaseLabel('Complete');
      setMessage('File uploaded successfully.');
      onUploaded();
    } catch (e) {
      if ((e as Error)?.name === 'AbortError' || (e as Error)?.message === 'Upload cancelled') {
        handleClose();
        return;
      }
      setStep('error');
      setError(e instanceof Error ? e.message : 'Upload failed');
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Upload content item" size="xl">
      <div className="space-y-4 max-h-[75vh] overflow-y-auto">
        {step === 'form' && (
          <>
            <DragDropZone
              selectedFile={file}
              onFileSelected={setFile}
              accept={acceptForType(contentType)}
              maxSizeBytes={MAX_BYTES}
              disabled={false}
            />
            <Input label="Name" value={name} onChange={(e) => setName(e.target.value)} fullWidth required />
            <Input
              label="Description (optional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              fullWidth
            />
            <Input label="Version (optional)" value={version} onChange={(e) => setVersion(e.target.value)} fullWidth />
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Content type</label>
              <select
                className="w-full rounded-md border border-panel bg-surface px-4 py-2 text-gray-900 dark:text-gray-100"
                value={contentType}
                onChange={(e) => setContentType(e.target.value as ContentTypeApi)}
              >
                {CONTENT_TYPES.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
            {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="secondary" onClick={handleClose}>
                Cancel
              </Button>
              <Button onClick={() => void startUpload()} disabled={!file || !name.trim()}>
                Start upload
              </Button>
            </div>
          </>
        )}

        {step === 'hashing' && (
          <div className="py-8 text-center text-gray-600 dark:text-gray-400">
            <p className="font-medium">{phaseLabel}</p>
            <p className="text-sm mt-1">{message}</p>
          </div>
        )}

        {(step === 'uploading' || step === 'done') && (
          <UploadProgressBar
            uploadedBytes={uploadedBytes}
            totalSize={totalSize || file?.size || 0}
            phase={phaseLabel}
            message={message}
            error={step === 'done' ? null : error}
            onCancel={step === 'uploading' ? () => abortRef.current?.abort() : undefined}
            cancelDisabled={false}
          />
        )}

        {step === 'done' && (
          <div className="space-y-2">
            {message && <p className="text-sm text-gray-600 dark:text-gray-400">{message}</p>}
            {createdItemId && (
              <p className="text-xs text-gray-500 font-mono break-all">Item ID: {createdItemId}</p>
            )}
            <div className="flex justify-end pt-2">
              <Button onClick={handleClose}>Close</Button>
            </div>
          </div>
        )}

        {step === 'error' && (
          <div className="space-y-3">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setStep('form')}>
                Back
              </Button>
              <Button onClick={handleClose}>Close</Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
