'use client';

import type { FileWithMetadata } from '@/types/vm-template-spec';
import { formatBytes } from '@/lib/vm-template-defaults';
import { Button } from '@/components/ui/atoms/button';

interface MultiFileUploadProgressProps {
  files: FileWithMetadata[];
  onCancel?: () => void;
  cancelDisabled?: boolean;
}

export function MultiFileUploadProgress({
  files,
  onCancel,
  cancelDisabled = false,
}: MultiFileUploadProgressProps) {
  // Calculate overall progress
  const totalSize = files.reduce((sum, f) => sum + f.file.size, 0);
  const uploadedTotal = files.reduce((sum, f) => sum + (f.uploadedBytes || 0), 0);
  const overallProgress = totalSize > 0 ? (uploadedTotal / totalSize) * 100 : 0;
  
  const completedCount = files.filter(f => f.status === 'complete').length;
  const errorCount = files.filter(f => f.status === 'error').length;
  const activeFile = files.find(f => f.status === 'hashing' || f.status === 'uploading');

  return (
    <div className="space-y-4">
      {/* Overall progress */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium text-gray-700 dark:text-gray-300">
            Overall Progress
          </span>
          <span className="text-gray-600 dark:text-gray-400">
            {completedCount} of {files.length} files complete
            {errorCount > 0 && (
              <span className="ml-2 text-red-600 dark:text-red-400">
                ({errorCount} {errorCount === 1 ? 'error' : 'errors'})
              </span>
            )}
          </span>
        </div>
        <div className="h-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${overallProgress}%` }}
          />
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-400 text-right">
          {formatBytes(uploadedTotal)} / {formatBytes(totalSize)}
        </div>
      </div>

      {/* Individual file progress */}
      <div className="space-y-3 max-h-[400px] overflow-y-auto">
        {files.map((fileData) => {
          const fileProgress = fileData.file.size > 0 
            ? ((fileData.uploadedBytes || 0) / fileData.file.size) * 100 
            : 0;
          const isActive = fileData.id === activeFile?.id;

          return (
            <div
              key={fileData.id}
              className={`
                rounded-lg border p-3 transition-all
                ${isActive 
                  ? 'border-primary bg-primary/5 dark:bg-primary/10' 
                  : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
                }
              `}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                    {fileData.file.name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {formatBytes(fileData.file.size)}
                    {fileData.diskIndex !== undefined && ` • Disk ${fileData.diskIndex}`}
                  </p>
                </div>
                
                {/* Status indicator */}
                <div className="ml-3 flex-shrink-0">
                  {fileData.status === 'pending' && (
                    <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400">
                      Pending
                    </span>
                  )}
                  {fileData.status === 'hashing' && (
                    <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400">
                      Hashing
                    </span>
                  )}
                  {fileData.status === 'uploading' && (
                    <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-primary/20 text-primary">
                      Uploading
                    </span>
                  )}
                  {fileData.status === 'complete' && (
                    <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400">
                      Complete
                    </span>
                  )}
                  {fileData.status === 'error' && (
                    <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-400">
                      Error
                    </span>
                  )}
                </div>
              </div>

              {/* Progress bar */}
              {(fileData.status === 'hashing' || fileData.status === 'uploading') && (
                <div className="space-y-1">
                  <div className="h-1.5 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all duration-300"
                      style={{ width: `${fileProgress}%` }}
                    />
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {formatBytes(fileData.uploadedBytes || 0)} / {formatBytes(fileData.file.size)}
                    {fileProgress > 0 && ` (${fileProgress.toFixed(1)}%)`}
                  </div>
                </div>
              )}

              {/* Error message */}
              {fileData.status === 'error' && fileData.error && (
                <p className="text-xs text-red-600 dark:text-red-400 mt-2">
                  {fileData.error}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {/* Cancel button */}
      {onCancel && (
        <div className="flex justify-end pt-2">
          <Button
            variant="secondary"
            onClick={onCancel}
            disabled={cancelDisabled}
          >
            Cancel Upload
          </Button>
        </div>
      )}
    </div>
  );
}
