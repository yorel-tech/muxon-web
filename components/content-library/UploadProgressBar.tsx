'use client';

import { Button } from '@/components/ui/atoms/button';
import { formatBytes } from '@/lib/format-bytes';
import { cn } from '@/lib/utils';

export interface UploadProgressBarProps {
  uploadedBytes: number;
  totalSize: number;
  phase: string;
  message?: string;
  error?: string | null;
  onCancel?: () => void;
  cancelDisabled?: boolean;
}

export function UploadProgressBar({
  uploadedBytes,
  totalSize,
  phase,
  message,
  error,
  onCancel,
  cancelDisabled,
}: UploadProgressBarProps) {
  const pct = totalSize > 0 ? Math.min(100, Math.round((uploadedBytes / totalSize) * 100)) : 0;

  return (
    <div className="space-y-3">
      <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
        <span>{phase}</span>
        <span>
          {formatBytes(uploadedBytes)} / {formatBytes(totalSize)} ({pct}%)
        </span>
      </div>
      <div className="h-2 w-full rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all duration-300', error ? 'bg-red-500' : 'bg-primary-600')}
          style={{ width: `${pct}%` }}
        />
      </div>
      {message && <p className="text-xs text-gray-500 dark:text-gray-400">{message}</p>}
      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
      {onCancel && (
        <Button type="button" variant="secondary" size="sm" onClick={onCancel} disabled={cancelDisabled}>
          Cancel upload
        </Button>
      )}
    </div>
  );
}
