/** Types aligned with infron-core openapi/storage.yaml (subset for UI) */

export interface StorageCapabilities {
  performance?: 'high' | 'medium' | 'low';
  media?: 'ssd' | 'hdd' | 'nvme' | 'any';
  shared?: boolean;
  redundancy?: 'replicated' | 'none';
}

export interface StorageConstraints {
  minIops?: number;
  maxLatencyMs?: number;
}

export interface Metadata {
  [key: string]: unknown;
}

export interface StorageClass {
  id?: string;
  name: string;
  description?: string;
  capabilities: StorageCapabilities;
  constraints?: StorageConstraints;
  metadata?: Metadata;
  createdAt?: string;
  updatedAt?: string;
  _links?: unknown[];
}

export interface StorageClassCreate {
  name: string;
  description?: string;
  capabilities: StorageCapabilities;
  constraints?: StorageConstraints;
  metadata?: Metadata;
}

export interface StorageClassUpdate {
  description?: string;
  capabilities?: StorageCapabilities;
  constraints?: StorageConstraints;
  metadata?: Metadata;
}

export interface MappedStorageClassInfo {
  storageClassName: string;
  mappingSource: 'override' | 'scheduler';
}

export interface ProviderStorageCapabilities extends StorageCapabilities {
  [key: string]: unknown;
}

export interface ProviderStorageMetrics {
  totalGb?: number;
  freeGb?: number;
  usedGb?: number;
  estimatedIops?: number;
  latencyMs?: number;
  [key: string]: unknown;
}

export interface ProviderStorage {
  id: string;
  providerId: string;
  providerType: string;
  externalId?: string;
  storageType: string;
  datacenterId?: string | null;
  nodeId?: string | null;
  enabled?: boolean;
  syncedAt?: string | null;
  capabilities: ProviderStorageCapabilities;
  metrics: ProviderStorageMetrics;
  mappedStorageClasses?: MappedStorageClassInfo[];
  name?: string;
  createdAt?: string;
  updatedAt?: string;
  _links?: unknown[];
}

export interface StorageClassOverride {
  providerType: string;
  datacenterId?: string | null;
  providerStorageNames: string[];
  priority?: number;
}

export interface StorageClassOverrides {
  storageClassName: string;
  overrides: StorageClassOverride[];
}

export interface StorageSyncResponse {
  providerId?: string;
  status?: 'accepted' | 'completed' | 'failed';
  discoveredCount?: number;
  message?: string;
}

/** Flat row for UI lists */
export interface StorageOverrideRow {
  storageClassName: string;
  index: number;
  override: StorageClassOverride;
}
