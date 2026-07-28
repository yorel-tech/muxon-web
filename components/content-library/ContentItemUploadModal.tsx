"use client";

import { useState, useRef } from "react";
import { Modal } from "@/components/ui/molecules/modal";
import { Button } from "@/components/ui/atoms/button";
import { Input } from "@/components/ui/atoms/input";
import { DragDropZone } from "@/components/content-library/DragDropZone";
import { UploadProgressBar } from "@/components/content-library/UploadProgressBar";
import { MultiFileUploadProgress } from "@/components/content-library/MultiFileUploadProgress";
import { VmTemplateWizard } from "@/components/content-library/wizard/VmTemplateWizard";
import { calculateFileSha256 } from "@/lib/checksum";
import { createPlatformContentItem, createTenantContentItem } from "@/lib/api/content-library";
import { initiateUploadSession, uploadFileInChunks } from "@/lib/chunked-upload";
import type { ContentTypeApi, ContentItemCreateRequest } from "@/types/content-library";
import type { VmTemplateSpec, FileWithMetadata } from "@/types/vm-template-spec";

const MAX_BYTES = 50 * 1024 * 1024 * 1024; // 50 GiB

const CONTENT_TYPES: { value: ContentTypeApi; label: string }[] = [
  { value: "vm_template", label: "VM template" },
  { value: "iso", label: "ISO" },
  { value: "script", label: "Script" },
];

function acceptForType(t: ContentTypeApi): string {
  switch (t) {
    case "iso":
      return ".iso";
    case "script":
      return ".sh,.yaml,.yml,.ps1,.txt";
    case "vm_template":
    default:
      return ".qcow2,.raw,.img,.ova,.vmdk,.iso";
  }
}

/** Basename without extension for display name; version from first longest semver-like span (e.g. 22.04, 1.2.3). */
function deriveNameAndVersionFromFileName(fileName: string): { name: string; version: string } {
  const stem = fileName.replace(/\.[^./\\]+$/u, "");
  const versionRe = /\d+(?:\.\d+)+(?:-\d+)?/gu;
  let version = "";
  for (const m of stem.matchAll(versionRe)) {
    if (m[0].length > version.length) version = m[0];
  }
  return { name: stem, version };
}

export interface ContentItemUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  libraryId: string;
  scope: "platform" | "tenant";
  tenantId?: string | null;
  onUploaded: () => void;
}

type Step = "wizard" | "form" | "hashing" | "uploading" | "done" | "error";

export function ContentItemUploadModal({
  isOpen,
  onClose,
  libraryId,
  scope,
  tenantId,
  onUploaded,
}: ContentItemUploadModalProps) {
  const [step, setStep] = useState<Step>("wizard");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [version, setVersion] = useState("");
  const [contentType, setContentType] = useState<ContentTypeApi>("vm_template");
  const [file, setFile] = useState<File | null>(null);
  const [files, setFiles] = useState<FileWithMetadata[]>([]);
  const [uploadedBytes, setUploadedBytes] = useState(0);
  const [totalSize, setTotalSize] = useState(0);
  const [phaseLabel, setPhaseLabel] = useState("");
  const [message, setMessage] = useState<string | undefined>();
  const [error, setError] = useState<string | null>(null);
  const [createdItemId, setCreatedItemId] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const reset = () => {
    setStep("wizard");
    setName("");
    setDescription("");
    setVersion("");
    setContentType("vm_template");
    setFile(null);
    setFiles([]);
    setUploadedBytes(0);
    setTotalSize(0);
    setPhaseLabel("");
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

  const handleFileSelected = (f: File | null) => {
    setFile(f);
    if (f) {
      const derived = deriveNameAndVersionFromFileName(f.name);
      setName(derived.name);
      setVersion(derived.version);
    }
  };

  type SimpleUploadParams = {
    file: File;
    name: string;
    description: string;
    version: string;
    contentType: ContentTypeApi;
  };

  const runSimpleUpload = async ({
    file: uploadFile,
    name: itemName,
    description: itemDescription,
    version: itemVersion,
    contentType: itemContentType,
  }: SimpleUploadParams) => {
    setError(null);
    if (!itemName.trim()) {
      setError("Name and file are required.");
      return;
    }
    if (scope === "tenant" && !tenantId) {
      setError("Tenant context missing.");
      return;
    }

    abortRef.current = new AbortController();
    const signal = abortRef.current.signal;

    try {
      const item =
        scope === "platform"
          ? await createPlatformContentItem(libraryId, {
              name: itemName.trim(),
              description: itemDescription.trim() || undefined,
              version: itemVersion.trim() || undefined,
              contentType: itemContentType,
            })
          : await createTenantContentItem(tenantId!, libraryId, {
              name: itemName.trim(),
              description: itemDescription.trim() || undefined,
              version: itemVersion.trim() || undefined,
              contentType: itemContentType,
            });

      const itemId = item.id;
      setCreatedItemId(itemId);
      setTotalSize(uploadFile.size);

      setStep("hashing");
      setPhaseLabel("Computing checksum");
      setMessage("SHA-256…");

      const checksum = await calculateFileSha256(uploadFile);
      if (signal.aborted) return;

      setStep("uploading");
      setUploadedBytes(0);
      setPhaseLabel("Starting upload");
      setMessage(undefined);

      try {
        const session = await initiateUploadSession(
          scope,
          libraryId,
          itemId,
          {
            totalSize: uploadFile.size,
            checksumAlgorithm: "sha256",
            expectedChecksum: checksum,
            chunkSizeHint: 64 * 1024 * 1024,
          },
          tenantId ?? undefined
        );

        const uploadId = session.id;
        await uploadFileInChunks({
          scope,
          libraryId,
          itemId,
          uploadId,
          file: uploadFile,
          totalSize: uploadFile.size,
          signal,
          tenantId: tenantId ?? undefined,
          onProgress: (p) => {
            setUploadedBytes(p.uploadedBytes);
            setTotalSize(p.totalSize);
            setPhaseLabel(
              p.phase === "completing"
                ? "Finalizing"
                : p.phase === "done"
                  ? "Complete"
                  : "Uploading"
            );
            setMessage(p.message);
          },
        });
      } catch (uploadErr: unknown) {
        const msg = uploadErr instanceof Error ? uploadErr.message : String(uploadErr);
        if (msg.includes("404") || msg.includes("Not Found")) {
          setStep("done");
          setError(null);
          setMessage(
            "Content item metadata was created. Binary upload is not available on this server yet (upload API not deployed)."
          );
          onUploaded();
          return;
        }
        throw uploadErr;
      }

      if (signal.aborted) return;
      setStep("done");
      setPhaseLabel("Complete");
      setMessage(
        "File uploaded successfully. It is saved on the Muxon server under the content library artifact path."
      );
      onUploaded();
    } catch (e) {
      if ((e as Error)?.name === "AbortError" || (e as Error)?.message === "Upload cancelled") {
        handleClose();
        return;
      }
      setStep("error");
      setError(e instanceof Error ? e.message : "Upload failed");
    }
  };

  const startSimpleUpload = async () => {
    if (!file || !name.trim()) {
      setError("Name and file are required.");
      return;
    }
    await runSimpleUpload({
      file,
      name,
      description,
      version,
      contentType,
    });
  };

  // Multi-file upload for VM templates
  const startVmTemplateUpload = async (
    templateSpec: VmTemplateSpec,
    filesToUpload: FileWithMetadata[],
    itemName: string,
    itemVersion: string
  ) => {
    setError(null);
    if (filesToUpload.length === 0) {
      setError("At least one file is required.");
      return;
    }
    if (scope === "tenant" && !tenantId) {
      setError("Tenant context missing.");
      return;
    }

    abortRef.current = new AbortController();
    const signal = abortRef.current.signal;

    setFiles(filesToUpload);
    setStep("uploading");

    try {
      // Step 1: Create content item with templateSpec
      const createBody: ContentItemCreateRequest = {
        name: itemName.trim(),
        description: templateSpec.metadata.description || undefined,
        version: itemVersion.trim() || undefined,
        contentType: "vm_template",
        templateSpec,
      };

      const item =
        scope === "platform"
          ? await createPlatformContentItem(libraryId, createBody)
          : await createTenantContentItem(tenantId!, libraryId, createBody);

      const itemId = item.id;
      setCreatedItemId(itemId);

      // Step 2: Upload each file
      for (let i = 0; i < filesToUpload.length; i++) {
        if (signal.aborted) return;

        const fileData = filesToUpload[i];
        const updatedFiles = [...filesToUpload];

        // Update status to hashing
        updatedFiles[i] = { ...fileData, status: "hashing" };
        setFiles(updatedFiles);

        const checksum = await calculateFileSha256(fileData.file);
        if (signal.aborted) return;

        // Update status to uploading
        updatedFiles[i] = { ...updatedFiles[i], status: "uploading", uploadedBytes: 0 };
        setFiles(updatedFiles);

        try {
          const session = await initiateUploadSession(
            scope,
            libraryId,
            itemId,
            {
              totalSize: fileData.file.size,
              checksumAlgorithm: "sha256",
              expectedChecksum: checksum,
              chunkSizeHint: 64 * 1024 * 1024,
            },
            tenantId ?? undefined
          );

          const uploadId = session.id;
          await uploadFileInChunks({
            scope,
            libraryId,
            itemId,
            uploadId,
            file: fileData.file,
            totalSize: fileData.file.size,
            signal,
            tenantId: tenantId ?? undefined,
            onProgress: (p) => {
              const updated = [...filesToUpload];
              updated[i] = { ...updated[i], uploadedBytes: p.uploadedBytes };
              setFiles(updated);
            },
          });

          // Mark as complete
          updatedFiles[i] = { ...updatedFiles[i], status: "complete" };
          setFiles(updatedFiles);
        } catch (uploadErr: unknown) {
          const msg = uploadErr instanceof Error ? uploadErr.message : String(uploadErr);
          updatedFiles[i] = { ...updatedFiles[i], status: "error", error: msg };
          setFiles(updatedFiles);
          throw uploadErr;
        }
      }

      if (signal.aborted) return;
      setStep("done");
      setMessage("All files uploaded successfully. Template is being finalized on the server.");
      onUploaded();
    } catch (e) {
      if ((e as Error)?.name === "AbortError" || (e as Error)?.message === "Upload cancelled") {
        handleClose();
        return;
      }
      setStep("error");
      setError(e instanceof Error ? e.message : "Upload failed");
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Upload content item" size="xl">
      <div className="space-y-4 max-h-[75vh] overflow-y-auto">
        {/* VM Template Wizard - only show for vm_template */}
        {step === "wizard" && (
          <VmTemplateWizard
            onComplete={startVmTemplateUpload}
            onCancel={handleClose}
            onSimpleContentUpload={(payload) =>
              void runSimpleUpload({
                file: payload.file,
                name: payload.name,
                description: payload.description,
                version: "",
                contentType: payload.contentType,
              })
            }
          />
        )}

        {/* Simple Form for ISO/Script */}
        {step === "form" && (
          <>
            <DragDropZone
              selectedFile={file}
              onFileSelected={handleFileSelected}
              accept={acceptForType(contentType)}
              maxSizeBytes={MAX_BYTES}
              disabled={false}
            />
            <Input
              label="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              fullWidth
              required
            />
            <Input
              label="Description (optional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              fullWidth
            />
            <Input
              label="Version (optional)"
              value={version}
              onChange={(e) => setVersion(e.target.value)}
              fullWidth
            />
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Content type
              </label>
              <select
                className="w-full rounded-md border border-panel bg-surface px-4 py-2 text-gray-900 dark:text-gray-100"
                value={contentType}
                onChange={(e) => {
                  const newType = e.target.value as ContentTypeApi;
                  setContentType(newType);
                  // Switch to wizard for vm_template, form for others
                  if (newType === "vm_template") {
                    setStep("wizard");
                  }
                }}
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
              <Button onClick={() => void startSimpleUpload()} disabled={!file || !name.trim()}>
                Start upload
              </Button>
            </div>
          </>
        )}

        {/* Hashing Step */}
        {step === "hashing" && (
          <div className="py-8 text-center text-gray-600 dark:text-gray-400">
            <p className="font-medium">{phaseLabel}</p>
            <p className="text-sm mt-1">{message}</p>
          </div>
        )}

        {/* Uploading Step - Simple or Multi-file */}
        {step === "uploading" && (
          <>
            {files.length > 0 ? (
              <MultiFileUploadProgress
                files={files}
                onCancel={() => abortRef.current?.abort()}
                cancelDisabled={false}
              />
            ) : (
              <UploadProgressBar
                uploadedBytes={uploadedBytes}
                totalSize={totalSize || file?.size || 0}
                phase={phaseLabel}
                message={message}
                error={null}
                onCancel={() => abortRef.current?.abort()}
                cancelDisabled={false}
              />
            )}
          </>
        )}

        {/* Done Step */}
        {step === "done" && (
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

        {/* Error Step */}
        {step === "error" && (
          <div className="space-y-3">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setStep("wizard")}>
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
