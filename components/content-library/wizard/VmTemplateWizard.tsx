'use client';

import { useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/atoms/button';
import type { VmTemplateSpec, FileWithMetadata } from '@/types/vm-template-spec';
import type { ContentTypeApi } from '@/types/content-library';
import { createDefaultVmTemplateSpec, validateVmTemplateSpec, createDefaultDiskSpec } from '@/lib/vm-template-defaults';
import { VmTemplateFilesStep } from './VmTemplateFilesStep';
import { VmTemplateMetadataStep } from './VmTemplateMetadataStep';
import { VmTemplateComputeStep } from './VmTemplateComputeStep';
import { VmTemplateDisksStep } from './VmTemplateDisksStep';
import { VmTemplateNetworkStep } from './VmTemplateNetworkStep';
import { VmTemplateReviewStep } from './VmTemplateReviewStep';

interface VmTemplateWizardProps {
  onComplete: (templateSpec: VmTemplateSpec, files: FileWithMetadata[], name: string, version: string) => void;
  onCancel: () => void;
  /** Single-screen ISO/script: create item + upload one file (no wizard steps). */
  onSimpleContentUpload: (payload: {
    file: File;
    name: string;
    description: string;
    contentType: 'iso' | 'script';
  }) => void;
}

/** Full VM template flow; ISO and script are a single files screen only. */
type WizardPhase = 'files' | 'metadata' | 'compute' | 'disks' | 'network' | 'review';

const VM_TEMPLATE_PHASES: WizardPhase[] = [
  'files',
  'metadata',
  'compute',
  'disks',
  'network',
  'review',
];

const PHASE_LABELS: Record<WizardPhase, string> = {
  files: 'Files',
  metadata: 'Metadata',
  compute: 'Compute',
  disks: 'Disks',
  network: 'Network',
  review: 'Review',
};

function phasesForContentType(contentType: ContentTypeApi): WizardPhase[] {
  if (contentType === 'vm_template') return VM_TEMPLATE_PHASES;
  return ['files'];
}

function isSimpleSingleFileType(t: ContentTypeApi): t is 'iso' | 'script' {
  return t === 'iso' || t === 'script';
}

export function VmTemplateWizard({ onComplete, onCancel, onSimpleContentUpload }: VmTemplateWizardProps) {
  const [currentPhase, setCurrentPhase] = useState<WizardPhase>('files');
  const [files, setFiles] = useState<FileWithMetadata[]>([]);
  const [name, setName] = useState('');
  const [version, setVersion] = useState('');
  const [description, setDescription] = useState('');
  const [contentType, setContentType] = useState<ContentTypeApi>('vm_template');
  const [templateSpec, setTemplateSpec] = useState<VmTemplateSpec>(() =>
    createDefaultVmTemplateSpec([], '')
  );

  // Auto-derive name from first file
  useEffect(() => {
    if (files.length > 0 && !name) {
      const firstFile = files[0].file;
      const baseName = firstFile.name.replace(/\.[^./\\]+$/u, '');
      setName(baseName);
      setTemplateSpec(prev => ({
        ...prev,
        metadata: { ...prev.metadata, name: baseName },
      }));
    }
  }, [files, name]);

  // Keep wizard phase valid when switching content type.
  useEffect(() => {
    const phases = phasesForContentType(contentType);
    setCurrentPhase((prev) => {
      if (phases.includes(prev)) return prev;
      return 'files';
    });
  }, [contentType]);

  // ISO/script allow only one file (e.g. after switching from VM template with multiple disks).
  useEffect(() => {
    if (!isSimpleSingleFileType(contentType) || files.length <= 1) return;
    const first = files[0]!;
    setFiles([first]);
    setTemplateSpec((prev) => ({
      ...prev,
      spec: { ...prev.spec, disks: [createDefaultDiskSpec(first.file, 0)] },
    }));
  }, [contentType, files.length]);

  const handleNameChange = useCallback((next: string) => {
    setName(next);
    setTemplateSpec((prev) => ({
      ...prev,
      metadata: { ...prev.metadata, name: next },
    }));
  }, []);

  const handleFilesSelected = useCallback(
    (newFiles: File[]) => {
      if (isSimpleSingleFileType(contentType)) {
        const file = newFiles[0];
        if (!file) return;
        const fileMetadata: FileWithMetadata[] = [
          {
            file,
            id: `file-${Date.now()}-0`,
            diskIndex: 0,
            status: 'pending',
          },
        ];
        setFiles(fileMetadata);
        setTemplateSpec((prev) => ({
          ...prev,
          spec: { ...prev.spec, disks: [createDefaultDiskSpec(file, 0)] },
        }));
        return;
      }

      const fileMetadata: FileWithMetadata[] = newFiles.map((file, index) => ({
        file,
        id: `file-${Date.now()}-${index}`,
        diskIndex: files.length + index,
        status: 'pending',
      }));

      const updatedFiles = [...files, ...fileMetadata];
      setFiles(updatedFiles);

      const allFiles = updatedFiles.map((f) => f.file);
      const newDisks = allFiles.map((file, i) => createDefaultDiskSpec(file, i));

      setTemplateSpec((prev) => ({
        ...prev,
        spec: { ...prev.spec, disks: newDisks },
      }));
    },
    [files, contentType],
  );

  const handleFileRemove = useCallback((fileId: string) => {
    const updatedFiles = files.filter(f => f.id !== fileId);
    setFiles(updatedFiles);

    // Update disk specs
    const allFiles = updatedFiles.map(f => f.file);
    const newDisks = allFiles.map((file, i) => createDefaultDiskSpec(file, i));
    
    setTemplateSpec(prev => ({
      ...prev,
      spec: { ...prev.spec, disks: newDisks },
    }));
  }, [files]);

  const canProceed = useCallback(() => {
    switch (currentPhase) {
      case 'files':
        if (isSimpleSingleFileType(contentType)) {
          return files.length === 1 && name.trim() !== '';
        }
        return files.length > 0 && name.trim() !== '';
      case 'metadata':
        return templateSpec.metadata.name.trim() !== '';
      case 'compute':
        return (
          templateSpec.spec.compute.cpuCores >= 1 &&
          templateSpec.spec.compute.memoryMB >= 512
        );
      case 'disks': {
        const bootDisks = templateSpec.spec.disks.filter(d => d.bootOrder === 1);
        const diskIds = templateSpec.spec.disks.map(d => d.id);
        const uniqueDiskIds = new Set(diskIds);
        return (
          bootDisks.length === 1 &&
          uniqueDiskIds.size === diskIds.length &&
          diskIds.every(id => id && id.trim() !== '')
        );
      }
      case 'network': {
        const networkIds = templateSpec.spec.network.map(n => n.id);
        const uniqueNetworkIds = new Set(networkIds);
        return (
          templateSpec.spec.network.length > 0 &&
          uniqueNetworkIds.size === networkIds.length &&
          networkIds.every(id => id && id.trim() !== '')
        );
      }
      case 'review':
        return true;
      default:
        return false;
    }
  }, [currentPhase, contentType, files, name, templateSpec]);

  const handleSimpleContentUpload = () => {
    if (!isSimpleSingleFileType(contentType) || !canProceed() || files.length !== 1) return;
    onSimpleContentUpload({
      file: files[0]!.file,
      name: name.trim(),
      description: description.trim(),
      contentType,
    });
  };

  const handleNext = () => {
    const phases = phasesForContentType(contentType);
    const idx = phases.indexOf(currentPhase);
    if (idx >= 0 && idx < phases.length - 1 && canProceed()) {
      setCurrentPhase(phases[idx + 1]!);
    }
  };

  const handleBack = () => {
    const phases = phasesForContentType(contentType);
    const idx = phases.indexOf(currentPhase);
    if (idx > 0) {
      setCurrentPhase(phases[idx - 1]!);
    }
  };

  const handleSubmit = () => {
    const errors = validateVmTemplateSpec(templateSpec);
    if (errors.length > 0) {
      alert('Validation errors:\n' + errors.join('\n'));
      return;
    }
    onComplete(templateSpec, files, name, version);
  };

  const steps = phasesForContentType(contentType).map((phase, index) => ({
    phase,
    displayNumber: index + 1,
    label: PHASE_LABELS[phase],
  }));
  const currentStepIndex = steps.findIndex((s) => s.phase === currentPhase);
  const showStepper = steps.length > 1;

  return (
    <div className="space-y-6">
      {showStepper && (
        <div className="flex items-center justify-between">
          {steps.map((step, index) => (
            <div key={step.phase} className="flex items-center flex-1">
              <div className="flex flex-col items-center flex-1">
                <div
                  className={`
                  w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                  ${currentPhase === step.phase
                    ? 'bg-primary text-white'
                    : currentStepIndex > index
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                  }
                `}
                >
                  {currentStepIndex > index ? '✓' : step.displayNumber}
                </div>
                <span className="text-xs mt-1 text-gray-600 dark:text-gray-400">
                  {step.label}
                </span>
              </div>
              {index < steps.length - 1 && (
                <div
                  className={`
                  h-0.5 flex-1 mx-2
                  ${currentStepIndex > index ? 'bg-green-500' : 'bg-gray-200 dark:bg-gray-700'}
                `}
                />
              )}
            </div>
          ))}
        </div>
      )}

      {/* Step Content */}
      <div className="min-h-[400px]">
        {currentPhase === 'files' && (
          <VmTemplateFilesStep
            files={files}
            onFilesSelected={handleFilesSelected}
            onFileRemove={handleFileRemove}
            name={name}
            onNameChange={handleNameChange}
            version={version}
            onVersionChange={setVersion}
            contentType={contentType}
            onContentTypeChange={setContentType}
            description={description}
            onDescriptionChange={setDescription}
          />
        )}

        {currentPhase === 'metadata' && (
          <VmTemplateMetadataStep
            metadata={templateSpec.metadata}
            onChange={(metadata) =>
              setTemplateSpec({ ...templateSpec, metadata })
            }
          />
        )}

        {currentPhase === 'compute' && (
          <VmTemplateComputeStep
            firmware={templateSpec.spec.firmware}
            onFirmwareChange={(firmware) =>
              setTemplateSpec({
                ...templateSpec,
                spec: { ...templateSpec.spec, firmware },
              })
            }
            compute={templateSpec.spec.compute}
            onChange={(compute) =>
              setTemplateSpec({
                ...templateSpec,
                spec: { ...templateSpec.spec, compute },
              })
            }
          />
        )}

        {currentPhase === 'disks' && (
          <VmTemplateDisksStep
            disks={templateSpec.spec.disks}
            onChange={(disks) =>
              setTemplateSpec({
                ...templateSpec,
                spec: { ...templateSpec.spec, disks },
              })
            }
          />
        )}

        {currentPhase === 'network' && (
          <VmTemplateNetworkStep
            network={templateSpec.spec.network}
            onNetworkChange={(network) =>
              setTemplateSpec({
                ...templateSpec,
                spec: { ...templateSpec.spec, network },
              })
            }
            cloudInit={templateSpec.spec.cloudInit}
            onCloudInitChange={(cloudInit) =>
              setTemplateSpec({
                ...templateSpec,
                spec: { ...templateSpec.spec, cloudInit },
              })
            }
          />
        )}

        {currentPhase === 'review' && (
          <VmTemplateReviewStep
            templateSpec={templateSpec}
            files={files}
          />
        )}
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between border-t border-gray-200 dark:border-gray-700 pt-4">
        <Button
          variant="secondary"
          onClick={currentPhase === 'files' ? onCancel : handleBack}
        >
          {currentPhase === 'files' ? 'Cancel' : 'Back'}
        </Button>

        {showStepper && (
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Step {Math.max(1, currentStepIndex + 1)} of {steps.length}
          </div>
        )}

        {isSimpleSingleFileType(contentType) && currentPhase === 'files' ? (
          <Button onClick={handleSimpleContentUpload} disabled={!canProceed()}>
            Upload
          </Button>
        ) : currentPhase !== 'review' ? (
          <Button onClick={handleNext} disabled={!canProceed()}>
            Next
          </Button>
        ) : (
          <Button onClick={handleSubmit} disabled={!canProceed()}>
            Create & Upload
          </Button>
        )}
      </div>
    </div>
  );
}
