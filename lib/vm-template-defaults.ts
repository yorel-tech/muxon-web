/**
 * Default values and validation for VM Template specifications
 */

import type { VmTemplateSpec, VmTemplateDiskSpec } from '@/types/vm-template-spec';

/**
 * Detect disk format from file extension
 */
export function detectDiskFormat(fileName: string): 'qcow2' | 'vmdk' | 'raw' | 'ova' | 'ovf' {
  const ext = fileName.toLowerCase().split('.').pop() || '';
  switch (ext) {
    case 'qcow2':
      return 'qcow2';
    case 'vmdk':
      return 'vmdk';
    case 'ova':
      return 'ova';
    case 'ovf':
      return 'ovf';
    case 'raw':
    case 'img':
      return 'raw';
    default:
      return 'qcow2';
  }
}

/**
 * Create default disk spec for a file
 */
export function createDefaultDiskSpec(
  file: File,
  diskIndex: number
): VmTemplateDiskSpec {
  return {
    id: `disk-${diskIndex}`,
    name: `disk-${diskIndex}`,
    format: detectDiskFormat(file.name),
    bus: 'scsi',
    controller: 0,
    unit: diskIndex,
    bootOrder: diskIndex + 1,
    sizeBytes: file.size,
    readonly: false,
  };
}

/**
 * Create default VM template spec from uploaded files
 */
export function createDefaultVmTemplateSpec(
  files: File[],
  baseName?: string
): VmTemplateSpec {
  const name = baseName || (files[0]?.name.replace(/\.[^./\\]+$/u, '') || 'vm-template');
  
  return {
    apiVersion: 'infron.io/v1',
    kind: 'VmTemplate',
    metadata: {
      name,
      description: '',
      osFamily: 'linux',
      osDistribution: '',
      osVersion: '',
    },
    spec: {
      firmware: 'bios',
      compute: {
        cpuCores: 2,
        cpuSockets: 1,
        memoryMB: 4096,
      },
      disks: files.map((file, i) => createDefaultDiskSpec(file, i)),
      network: [{
        id: 'net-0',
        model: 'virtio',
      }],
      cloudInit: {
        enabled: true,
      },
    },
  };
}

/**
 * Validate VM template specification
 * Returns array of error messages (empty if valid)
 */
export function validateVmTemplateSpec(spec: VmTemplateSpec): string[] {
  const errors: string[] = [];
  
  // Metadata validation
  if (!spec.metadata.name || spec.metadata.name.trim() === '') {
    errors.push('Template name is required');
  }
  
  // Compute validation
  if (spec.spec.compute.cpuCores < 1) {
    errors.push('CPU cores must be at least 1');
  }
  if (spec.spec.compute.cpuSockets && spec.spec.compute.cpuSockets < 1) {
    errors.push('CPU sockets must be at least 1');
  }
  if (spec.spec.compute.memoryMB < 512) {
    errors.push('Memory must be at least 512 MB');
  }
  
  // Disk validation
  if (spec.spec.disks.length === 0) {
    errors.push('At least one disk is required');
  }
  
  const bootDisks = spec.spec.disks.filter(d => d.bootOrder === 1);
  if (bootDisks.length === 0) {
    errors.push('At least one disk must have bootOrder=1 (boot disk)');
  } else if (bootDisks.length > 1) {
    errors.push('Only one disk can have bootOrder=1 (boot disk)');
  }
  
  // Check for unique disk IDs
  const diskIds = spec.spec.disks.map(d => d.id);
  const uniqueDiskIds = new Set(diskIds);
  if (uniqueDiskIds.size !== diskIds.length) {
    errors.push('Disk IDs must be unique');
  }
  
  // Check for empty disk IDs
  if (diskIds.some(id => !id || id.trim() === '')) {
    errors.push('All disks must have a non-empty ID');
  }
  
  // Check boot orders are valid
  const bootOrders = spec.spec.disks.map(d => d.bootOrder).sort((a, b) => a - b);
  for (let i = 0; i < bootOrders.length; i++) {
    if (bootOrders[i] < 1) {
      errors.push('Boot order must be at least 1');
      break;
    }
  }
  
  // Network validation
  if (spec.spec.network.length === 0) {
    errors.push('At least one network interface is required');
  }
  
  // Check for unique network IDs
  const networkIds = spec.spec.network.map(n => n.id);
  const uniqueNetworkIds = new Set(networkIds);
  if (uniqueNetworkIds.size !== networkIds.length) {
    errors.push('Network interface IDs must be unique');
  }
  
  // Check for empty network IDs
  if (networkIds.some(id => !id || id.trim() === '')) {
    errors.push('All network interfaces must have a non-empty ID');
  }
  
  return errors;
}

/**
 * Format bytes to human-readable size
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Convert MB to GB for display
 */
export function mbToGb(mb: number): string {
  return (mb / 1024).toFixed(2);
}

/**
 * Convert GB to MB
 */
export function gbToMb(gb: number): number {
  return Math.round(gb * 1024);
}
