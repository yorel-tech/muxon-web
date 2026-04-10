'use client';

import { MultiFileUploadZone } from '../MultiFileUploadZone';
import type { FileWithMetadata } from '@/types/vm-template-spec';
import type { ContentTypeApi } from '@/types/content-library';

interface VmTemplateFilesStepProps {
  files: FileWithMetadata[];
  onFilesSelected: (files: File[]) => void;
  onFileRemove: (fileId: string) => void;
  name: string;
  onNameChange: (name: string) => void;
  version: string;
  onVersionChange: (version: string) => void;
  contentType: ContentTypeApi;
  onContentTypeChange: (type: ContentTypeApi) => void;
  /** ISO/script single-screen: optional description. */
  description?: string;
  onDescriptionChange?: (value: string) => void;
}

const CONTENT_TYPES: { value: ContentTypeApi; label: string; multiFile: boolean }[] = [
  { value: 'vm_template', label: 'VM Template', multiFile: true },
  { value: 'iso', label: 'ISO Image', multiFile: false },
  { value: 'script', label: 'Script', multiFile: false },
];

export function VmTemplateFilesStep({
  files,
  onFilesSelected,
  onFileRemove,
  name,
  onNameChange,
  version,
  onVersionChange,
  contentType,
  onContentTypeChange,
  description = '',
  onDescriptionChange,
}: VmTemplateFilesStepProps) {
  const selectedType = CONTENT_TYPES.find(t => t.value === contentType);
  const isSimpleSingleFile = contentType === 'iso' || contentType === 'script';

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          {contentType === 'iso'
            ? 'ISO image'
            : contentType === 'script'
              ? 'Script'
              : 'Files & Basic Information'}
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {contentType === 'iso'
            ? 'Choose an ISO file, set the name and description, then upload.'
            : contentType === 'script'
              ? 'Choose a script file, set the name and description, then upload.'
              : 'Select the content type and upload files. Multiple files are supported for VM templates only.'}
        </p>
      </div>

      {/* Content Type Selector */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Content Type <span className="text-red-500">*</span>
        </label>
        <select
          value={contentType}
          onChange={(e) => onContentTypeChange(e.target.value as ContentTypeApi)}
          className="w-full rounded-md border border-panel bg-surface px-4 py-2 text-gray-900 dark:text-gray-100"
        >
          {CONTENT_TYPES.map((type) => (
            <option key={type.value} value={type.value}>
              {type.label}
            </option>
          ))}
        </select>
        {selectedType?.multiFile && (
          <p className="mt-1 text-xs text-primary">
            Multiple files supported - useful for multi-disk VM templates (e.g., boot disk + data disks)
          </p>
        )}
      </div>

      {/* File Upload Zone */}
      <MultiFileUploadZone
        files={files}
        onFilesSelected={onFilesSelected}
        onFileRemove={onFileRemove}
        accept={contentType === 'iso' ? '.iso' : contentType === 'script' ? '.sh,.yaml,.yml,.ps1,.txt' : '.qcow2,.vmdk,.raw,.img,.ova,.ovf'}
        disabled={false}
        allowMultiple={!isSimpleSingleFile}
      />

      {/* Name and Version */}
      <div className={`grid grid-cols-1 gap-4 ${isSimpleSingleFile ? '' : 'md:grid-cols-2'}`}>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => onNameChange(e.target.value)}
            placeholder="e.g., ubuntu-22-04"
            className="w-full rounded-md border border-panel bg-surface px-4 py-2 text-gray-900 dark:text-gray-100"
            required
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Auto-derived from first file name
          </p>
        </div>

        {isSimpleSingleFile && onDescriptionChange && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Description (optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => onDescriptionChange(e.target.value)}
              placeholder={
                contentType === 'script'
                  ? 'e.g., Post-install cloud-init helper'
                  : 'e.g., TinyCore Linux install media'
              }
              rows={3}
              className="w-full rounded-md border border-panel bg-surface px-4 py-2 text-gray-900 dark:text-gray-100"
            />
          </div>
        )}

        {!isSimpleSingleFile && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Version (optional)
            </label>
            <input
              type="text"
              value={version}
              onChange={(e) => onVersionChange(e.target.value)}
              placeholder="e.g., 22.04"
              className="w-full rounded-md border border-panel bg-surface px-4 py-2 text-gray-900 dark:text-gray-100"
            />
          </div>
        )}
      </div>
    </div>
  );
}
