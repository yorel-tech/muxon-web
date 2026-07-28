/**
 * Storage API helpers — aligned with muxon-core openapi/storage.yaml
 */

import { apiGet, apiPost, apiPut, apiPatch, apiDelete } from "@/lib/api";
import type {
  StorageClass,
  StorageClassCreate,
  StorageClassUpdate,
  StorageClassOverrides,
  ProviderStorage,
  StorageSyncResponse,
} from "@/lib/types/storage";

const V1 = "/api/v1";

/** Normalize list responses that may be bare arrays or { items: T[] } */
export function normalizeItems<T>(data: unknown): T[] {
  if (Array.isArray(data)) {
    return data as T[];
  }
  if (data && typeof data === "object" && Array.isArray((data as { items?: unknown }).items)) {
    return (data as { items: T[] }).items;
  }
  return [];
}

export const storageApi = {
  listStorageClasses: (): Promise<StorageClass[]> =>
    apiGet<StorageClass[] | { items?: StorageClass[] }>(`${V1}/storage-classes`).then((d) =>
      normalizeItems<StorageClass>(d)
    ),

  getStorageClass: (name: string): Promise<StorageClass> =>
    apiGet<StorageClass>(`${V1}/storage-classes/${encodeURIComponent(name)}`),

  createStorageClass: (body: StorageClassCreate): Promise<StorageClass> =>
    apiPost<StorageClass>(`${V1}/storage-classes`, body),

  replaceStorageClass: (name: string, body: StorageClassUpdate): Promise<StorageClass> =>
    apiPut<StorageClass>(`${V1}/storage-classes/${encodeURIComponent(name)}`, body),

  patchStorageClass: (name: string, body: StorageClassUpdate): Promise<StorageClass> =>
    apiPatch<StorageClass>(`${V1}/storage-classes/${encodeURIComponent(name)}`, body),

  deleteStorageClass: (name: string): Promise<void> =>
    apiDelete<void>(`${V1}/storage-classes/${encodeURIComponent(name)}`),

  getStorageClassOverrides: (storageClassName: string): Promise<StorageClassOverrides> =>
    apiGet<StorageClassOverrides>(
      `${V1}/storage-classes/${encodeURIComponent(storageClassName)}/storage-overrides`
    ),

  replaceStorageClassOverrides: (
    storageClassName: string,
    body: StorageClassOverrides
  ): Promise<StorageClassOverrides> =>
    apiPut<StorageClassOverrides>(
      `${V1}/storage-classes/${encodeURIComponent(storageClassName)}/storage-overrides`,
      body
    ),

  listProviderStorageGlobal: (params?: {
    providerId?: string;
    datacenterId?: string;
    storageClass?: string;
  }): Promise<ProviderStorage[]> => {
    const sp = new URLSearchParams();
    if (params?.providerId) sp.set("providerId", params.providerId);
    if (params?.datacenterId) sp.set("datacenterId", params.datacenterId);
    if (params?.storageClass) sp.set("storageClass", params.storageClass);
    const q = sp.toString();
    return apiGet<ProviderStorage[] | { items?: ProviderStorage[] }>(
      `${V1}/provider-storage${q ? `?${q}` : ""}`
    ).then((d) => normalizeItems<ProviderStorage>(d));
  },

  listProviderStorageByProvider: (
    providerId: string,
    params?: { storageClass?: string }
  ): Promise<ProviderStorage[]> => {
    const sp = new URLSearchParams();
    if (params?.storageClass) sp.set("storageClass", params.storageClass);
    const q = sp.toString();
    return apiGet<ProviderStorage[] | { items?: ProviderStorage[] }>(
      `${V1}/providers/${encodeURIComponent(providerId)}/storage${q ? `?${q}` : ""}`
    ).then((d) => normalizeItems<ProviderStorage>(d));
  },

  /** Provider storage rows mapped to a storage class (same shape as provider-storage list). */
  listProviderStorageForStorageClass: (storageClassName: string): Promise<ProviderStorage[]> =>
    apiGet<ProviderStorage[] | { items?: ProviderStorage[] }>(
      `${V1}/storage-classes/${encodeURIComponent(storageClassName)}/provider-storage`
    ).then((d) => normalizeItems<ProviderStorage>(d)),

  getProviderStorage: (id: string): Promise<ProviderStorage> =>
    apiGet<ProviderStorage>(`${V1}/provider-storage/${encodeURIComponent(id)}`),

  syncProviderStorage: (providerId: string): Promise<StorageSyncResponse> =>
    apiPost<StorageSyncResponse>(
      `${V1}/providers/${encodeURIComponent(providerId)}/sync-storage`,
      {}
    ),

  /** Optional scheduler dry-run — may 404 until backend implements it */
  resolveStorageClass: (name: string, body?: Record<string, unknown>): Promise<unknown> =>
    apiPost<unknown>(`${V1}/storage-classes/${encodeURIComponent(name)}/resolve`, body ?? {}),
};
