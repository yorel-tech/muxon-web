/** Re-export storage DTO types from lib (single source of truth). */
export type {
  StorageCapabilities,
  StorageConstraints,
  Metadata,
  StorageClass,
  StorageClassCreate,
  StorageClassUpdate,
  MappedStorageClassInfo,
  ProviderStorageCapabilities,
  ProviderStorageMetrics,
  ProviderStorage,
  StorageClassOverride,
  StorageClassOverrides,
  StorageSyncResponse,
  StorageOverrideRow,
} from "@/lib/types/storage";
