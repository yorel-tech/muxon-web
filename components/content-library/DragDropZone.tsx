'use client';

import { useRef, useState, useCallback } from 'react';
import { Upload } from 'lucide-react';
import { Button } from '@/components/ui/atoms/button';
import { formatBytes } from '@/lib/format-bytes';
import { cn } from '@/lib/utils';

export interface DragDropZoneProps {
  onFileSelected: (file: File | null) => void;
  accept?: string;
  maxSizeBytes?: number;
  disabled?: boolean;
  selectedFile: File | null;
  error?: string | null;
}

export function DragDropZone({
  onFileSelected,
  accept,
  maxSizeBytes,
  disabled,
  selectedFile,
  error: externalError,
}: DragDropZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const validateAndSet = useCallback(
    (file: File | null) => {
      setLocalError(null);
      if (!file) {
        onFileSelected(null);
        return;
      }
      if (maxSizeBytes != null && file.size > maxSizeBytes) {
        setLocalError(`File exceeds maximum size (${formatBytes(maxSizeBytes)}).`);
        return;
      }
      onFileSelected(file);
    },
    [maxSizeBytes, onFileSelected],
  );

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (disabled) return;
    const f = e.dataTransfer.files?.[0];
    validateAndSet(f ?? null);
  };

  const err = externalError ?? localError;

  return (
    <div className="space-y-2">
      <div
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled) setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        onClick={() => !disabled && inputRef.current?.click()}
        className={cn(
          'rounded-xl border-2 border-dashed px-6 py-10 text-center cursor-pointer transition-colors',
          dragOver ? 'border-primary-500 bg-primary-50/50 dark:bg-primary-900/20' : 'border-gray-300 dark:border-gray-600',
          disabled && 'opacity-50 cursor-not-allowed',
        )}
      >
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          accept={accept}
          disabled={disabled}
          onChange={(e) => validateAndSet(e.target.files?.[0] ?? null)}
        />
        <Upload className="mx-auto h-10 w-10 text-gray-400 mb-2" />
        <p className="text-sm font-medium text-gray-700 dark:text-gray-200">
          Drag and drop a file here, or click to browse
        </p>
        {selectedFile && (
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Selected: <span className="font-medium">{selectedFile.name}</span> ({formatBytes(selectedFile.size)})
          </p>
        )}
      </div>
      {selectedFile && (
        <Button type="button" variant="secondary" size="sm" onClick={() => validateAndSet(null)} disabled={disabled}>
          Clear file
        </Button>
      )}
      {err && <p className="text-sm text-red-600 dark:text-red-400">{err}</p>}
    </div>
  );
}
