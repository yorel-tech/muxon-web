"use client";

import { useCallback, useRef } from "react";
import { Button } from "@/components/ui/atoms/button";
import type { FileWithMetadata } from "@/types/vm-template-spec";
import { formatBytes } from "@/lib/vm-template-defaults";

interface MultiFileUploadZoneProps {
  files: FileWithMetadata[];
  onFilesSelected: (files: File[]) => void;
  onFileRemove: (fileId: string) => void;
  accept?: string;
  maxSizeBytes?: number;
  disabled?: boolean;
  /** When false, only one file and no “Add more” (e.g. ISO). */
  allowMultiple?: boolean;
}

export function MultiFileUploadZone({
  files,
  onFilesSelected,
  onFileRemove,
  accept = ".qcow2,.vmdk,.raw,.img,.ova,.ovf,.iso",
  maxSizeBytes = 50 * 1024 * 1024 * 1024, // 50 GiB
  disabled = false,
  allowMultiple = true,
}: MultiFileUploadZoneProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback(
    (selectedFiles: FileList | null) => {
      if (!selectedFiles || selectedFiles.length === 0) return;

      const validFiles: File[] = [];
      const errors: string[] = [];

      Array.from(selectedFiles).forEach((file) => {
        if (file.size > maxSizeBytes) {
          errors.push(`${file.name}: File too large (max ${formatBytes(maxSizeBytes)})`);
        } else {
          validFiles.push(file);
        }
      });

      if (errors.length > 0) {
        alert(errors.join("\n"));
      }

      if (validFiles.length > 0) {
        onFilesSelected(validFiles);
      }
    },
    [maxSizeBytes, onFilesSelected]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      if (disabled) return;
      handleFileSelect(e.dataTransfer.files);
    },
    [disabled, handleFileSelect]
  );

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      handleFileSelect(e.target.files);
      // Reset input so the same file can be selected again
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    },
    [handleFileSelect]
  );

  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-4">
      {/* Drop zone */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        className={`
          relative rounded-lg border-2 border-dashed p-8 text-center transition-colors
          ${disabled ? "cursor-not-allowed bg-gray-50 dark:bg-gray-800" : "cursor-pointer hover:border-primary"}
          ${files.length > 0 ? "border-gray-300 dark:border-gray-600" : "border-gray-400 dark:border-gray-500"}
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple={allowMultiple}
          accept={accept}
          onChange={handleInputChange}
          disabled={disabled}
          className="hidden"
        />

        <div className="space-y-2">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            stroke="currentColor"
            fill="none"
            viewBox="0 0 48 48"
            aria-hidden="true"
          >
            <path
              d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <div className="text-gray-600 dark:text-gray-400">
            <button
              type="button"
              onClick={handleBrowseClick}
              disabled={disabled}
              className="font-medium text-primary hover:text-primary-dark"
            >
              Browse files
            </button>
            {" or drag and drop"}
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-500">
            Supported: QCOW2, VMDK, RAW, OVA, OVF, ISO files (max {formatBytes(maxSizeBytes)} each)
          </p>
        </div>
      </div>

      {/* File list */}
      {files.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Selected files ({files.length})
          </h4>
          <div className="space-y-2">
            {files.map((fileData) => (
              <div
                key={fileData.id}
                className="flex items-center justify-between rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-3"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                    {fileData.file.name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {formatBytes(fileData.file.size)}
                    {fileData.diskIndex !== undefined && ` • Disk ${fileData.diskIndex}`}
                  </p>
                </div>

                <div className="flex items-center gap-2 ml-4">
                  {/* Status indicator */}
                  {fileData.status === "complete" && (
                    <svg className="h-5 w-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                  {fileData.status === "error" && (
                    <svg className="h-5 w-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}

                  {/* Remove button */}
                  {fileData.status === "pending" && !disabled && (
                    <button
                      type="button"
                      onClick={() => onFileRemove(fileData.id)}
                      className="text-gray-400 hover:text-red-500 transition-colors"
                      title="Remove file"
                    >
                      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add more files button */}
      {allowMultiple && files.length > 0 && !disabled && (
        <Button type="button" variant="secondary" onClick={handleBrowseClick} className="w-full">
          + Add more files
        </Button>
      )}
    </div>
  );
}
