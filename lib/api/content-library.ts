import { apiDelete, apiGet, apiPatch, apiPost } from '@/lib/api';
import type {
  ContentItemCreateBody,
  ContentItemListResponse,
  ContentItemRow,
  ContentItemUpdateBody,
  ContentLibraryCreateBody,
  ContentLibraryListResponse,
  ContentLibraryRow,
} from '@/types/content-library';

const PAGE_SIZE_FETCH = 100;

export async function fetchPlatformContentLibraries(
  page = 1,
  perPage = 100,
): Promise<ContentLibraryListResponse> {
  return apiGet<ContentLibraryListResponse>(
    `/api/v1/platform/content-libraries?page=${page}&perPage=${perPage}`,
  );
}

export async function createPlatformContentLibrary(
  body: ContentLibraryCreateBody,
): Promise<ContentLibraryRow> {
  return apiPost<ContentLibraryRow>('/api/v1/platform/content-libraries', body);
}

export async function fetchTenantContentLibraries(
  tenantId: string,
  page = 1,
  perPage = 100,
): Promise<ContentLibraryListResponse> {
  return apiGet<ContentLibraryListResponse>(
    `/api/v1/tenants/${tenantId}/content-libraries?page=${page}&perPage=${perPage}`,
  );
}

export async function fetchPlatformContentLibrary(libraryId: string): Promise<ContentLibraryRow> {
  return apiGet<ContentLibraryRow>(`/api/v1/platform/content-libraries/${libraryId}`);
}

export async function fetchTenantContentLibrary(
  tenantId: string,
  libraryId: string,
): Promise<ContentLibraryRow> {
  return apiGet<ContentLibraryRow>(`/api/v1/tenants/${tenantId}/content-libraries/${libraryId}`);
}

export async function fetchPlatformContentItemsPage(
  libraryId: string,
  page: number,
  perPage: number,
): Promise<ContentItemListResponse> {
  return apiGet<ContentItemListResponse>(
    `/api/v1/platform/content-libraries/${libraryId}/items?page=${page}&perPage=${perPage}`,
  );
}

export async function fetchTenantContentItemsPage(
  tenantId: string,
  libraryId: string,
  page: number,
  perPage: number,
): Promise<ContentItemListResponse> {
  return apiGet<ContentItemListResponse>(
    `/api/v1/tenants/${tenantId}/content-libraries/${libraryId}/items?page=${page}&perPage=${perPage}`,
  );
}

/**
 * Load all items for a library (paginates until exhausted) for client-side tab filter + paging.
 */
export async function fetchAllContentItems(
  scope: 'platform' | 'tenant',
  libraryId: string,
  tenantId?: string,
): Promise<ContentItemRow[]> {
  const all: ContentItemRow[] = [];
  let page = 1;
  let total: number | undefined;

  while (true) {
    const res =
      scope === 'platform'
        ? await fetchPlatformContentItemsPage(libraryId, page, PAGE_SIZE_FETCH)
        : await fetchTenantContentItemsPage(tenantId!, libraryId, page, PAGE_SIZE_FETCH);

    const batch = res.items ?? [];
    all.push(...batch);
    total = res.total;
    if (batch.length < PAGE_SIZE_FETCH) break;
    if (total != null && all.length >= total) break;
    page += 1;
    if (page > 500) break; // safety cap
  }

  return all;
}

export async function createPlatformContentItem(
  libraryId: string,
  body: ContentItemCreateBody,
): Promise<ContentItemRow> {
  return apiPost<ContentItemRow>(`/api/v1/platform/content-libraries/${libraryId}/items`, body);
}

export async function createTenantContentItem(
  tenantId: string,
  libraryId: string,
  body: ContentItemCreateBody,
): Promise<ContentItemRow> {
  return apiPost<ContentItemRow>(
    `/api/v1/tenants/${tenantId}/content-libraries/${libraryId}/items`,
    body,
  );
}

export async function updatePlatformContentItem(
  libraryId: string,
  itemId: string,
  body: ContentItemUpdateBody,
): Promise<ContentItemRow> {
  return apiPatch<ContentItemRow>(
    `/api/v1/platform/content-libraries/${libraryId}/items/${itemId}`,
    body,
  );
}

export async function updateTenantContentItem(
  tenantId: string,
  libraryId: string,
  itemId: string,
  body: ContentItemUpdateBody,
): Promise<ContentItemRow> {
  return apiPatch<ContentItemRow>(
    `/api/v1/tenants/${tenantId}/content-libraries/${libraryId}/items/${itemId}`,
    body,
  );
}

export async function deletePlatformContentItem(libraryId: string, itemId: string): Promise<void> {
  await apiDelete(`/api/v1/platform/content-libraries/${libraryId}/items/${itemId}`);
}

export async function deleteTenantContentItem(
  tenantId: string,
  libraryId: string,
  itemId: string,
): Promise<void> {
  await apiDelete(`/api/v1/tenants/${tenantId}/content-libraries/${libraryId}/items/${itemId}`);
}

export async function getTenantContentItem(
  tenantId: string,
  libraryId: string,
  itemId: string,
): Promise<ContentItemRow> {
  return apiGet<ContentItemRow>(
    `/api/v1/tenants/${tenantId}/content-libraries/${libraryId}/items/${itemId}`,
  );
}
