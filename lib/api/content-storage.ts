import { apiDelete, apiGet, apiPatch, apiPost } from "@/lib/api";
import type {
  ContentStorageListResponse,
  ContentStorageRow,
  ContentStorageTypeApi,
} from "@/types/content-storage";

export async function listContentStorages(
  page = 1,
  perPage = 100
): Promise<ContentStorageListResponse> {
  return apiGet<ContentStorageListResponse>(
    `/api/v1/platform/content-storages?page=${page}&perPage=${perPage}`
  );
}

export async function getContentStorage(id: string): Promise<ContentStorageRow> {
  return apiGet<ContentStorageRow>(`/api/v1/platform/content-storages/${id}`);
}

export async function createContentStorage(body: {
  name: string;
  type: ContentStorageTypeApi;
  config: Record<string, unknown>;
  isDefault?: boolean;
}): Promise<ContentStorageRow> {
  return apiPost<ContentStorageRow>("/api/v1/platform/content-storages", body);
}

export async function updateContentStorage(
  id: string,
  body: { name?: string; config?: Record<string, unknown>; isDefault?: boolean }
): Promise<ContentStorageRow> {
  return apiPatch<ContentStorageRow>(`/api/v1/platform/content-storages/${id}`, body);
}

export async function deleteContentStorage(id: string): Promise<void> {
  await apiDelete(`/api/v1/platform/content-storages/${id}`);
}
