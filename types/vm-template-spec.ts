/**
 * TypeScript types for VM Template Specification
 * Matches OpenAPI schemas in content_library.yaml
 */

export interface VmTemplateSpec {
  apiVersion: string;
  kind: "VmTemplate";
  metadata: VmTemplateSpecMetadata;
  spec: VmTemplateSpecBody;
}

export interface VmTemplateSpecMetadata {
  name: string;
  description?: string;
  osFamily?: "linux" | "windows" | "other";
  osDistribution?: string;
  osVersion?: string;
}

export interface VmTemplateSpecBody {
  firmware: "bios" | "uefi";
  compute: VmTemplateComputeSpec;
  disks: VmTemplateDiskSpec[];
  network: VmTemplateNetworkSpec[];
  cloudInit: VmTemplateCloudInitSpec;
}

export interface VmTemplateComputeSpec {
  cpuCores: number;
  cpuSockets?: number;
  memoryMB: number;
}

export interface VmTemplateDiskSpec {
  id: string;
  name?: string;
  path?: string;
  format: "qcow2" | "vmdk" | "raw" | "ova" | "ovf";
  bus: "scsi" | "virtio" | "ide" | "sata";
  controller?: number;
  unit?: number;
  bootOrder: number;
  sizeBytes: number;
  readonly: boolean;
  checksum?: string;
}

export interface VmTemplateNetworkSpec {
  id: string;
  model: "virtio" | "e1000" | "vmxnet3";
}

export interface VmTemplateCloudInitSpec {
  enabled: boolean;
}

/**
 * File metadata for multi-file uploads
 */
export interface FileWithMetadata {
  file: File;
  id: string;
  diskIndex?: number;
  status: "pending" | "hashing" | "uploading" | "complete" | "error";
  uploadedBytes?: number;
  error?: string;
}
